# Robust Authentication and Request Management Patterns for TypeScript HTTP Clients

This comprehensive research report examines production-ready patterns for implementing robust authentication and request management in TypeScript HTTP clients, addressing critical issues including race conditions in token refresh operations, request queuing strategies, and network resilience patterns. The analysis reveals that effective solutions require a combination of concurrency control mechanisms, state machine patterns, and circuit breaker implementations to handle high concurrent loads while maintaining reliability and security. Key findings include the superiority of single-flight token refresh patterns using promise deduplication, bounded request queuing with configurable limits, and comprehensive fallback strategies that gracefully handle both authentication and network failures.

## Token Refresh Concurrency Control Patterns

### Single-Flight Token Refresh Pattern

The most effective approach to preventing race conditions in token refresh operations is implementing a single-flight pattern that ensures only one refresh request is active at any time[2][4]. This pattern uses promise deduplication to coordinate multiple concurrent requests that encounter authentication failures.

```typescript
interface EnhancedAuthState {
  authStatus:
    | "unauthenticated"
    | "authenticating"
    | "authenticated"
    | "refresh_failed";
  currentAuthToken: AuthToken | null;
  currentRefreshToken: RefreshToken | null;
  refreshPromise: Promise | null; // Critical for deduplication
  requestQueue: QueuedRequest[];
  maxQueueSize: number;
}

class AuthManager {
  private state: EnhancedAuthState = {
    authStatus: "unauthenticated",
    currentAuthToken: null,
    currentRefreshToken: null,
    refreshPromise: null,
    requestQueue: [],
    maxQueueSize: 20,
  };

  async refreshToken(): Promise {
    // Check if refresh is already in progress
    if (this.state.refreshPromise) {
      return await this.state.refreshPromise;
    }

    // Create new refresh promise and store it
    this.state.refreshPromise = this.performTokenRefresh();

    try {
      await this.state.refreshPromise;
    } finally {
      this.state.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise {
    this.state.authStatus = "authenticating";

    try {
      const response = await this.httpClient.post("/auth/refresh", {
        refresh: this.state.currentRefreshToken,
      });

      this.state.currentAuthToken = response.auth_token;
      this.state.currentRefreshToken = response.refresh;
      this.state.authStatus = "authenticated";
    } catch (error) {
      this.state.authStatus = "refresh_failed";
      throw error;
    }
  }
}
```

This implementation leverages a shared promise instance to coordinate multiple concurrent refresh attempts[4]. When multiple requests encounter 401 errors simultaneously, they all await the same refresh promise rather than initiating separate refresh operations.

### Semaphore-Based Concurrency Control

For more granular control over concurrent operations, semaphore patterns provide bounded concurrency limits[5]. This approach is particularly useful when you need to limit the number of requests that can be queued while waiting for authentication resolution.

```typescript
import { getSemaphore } from "@henrygd/semaphore";

class ConcurrencyControlledAuthClient {
  private authSemaphore = getSemaphore("auth-operations", 1);
  private requestSemaphore = getSemaphore("pending-requests", 20);

  async executeWithAuth(operation: () => Promise): Promise {
    // Limit concurrent requests waiting for auth
    await this.requestSemaphore.acquire();

    try {
      return await this.withRetryOnAuth(operation);
    } finally {
      this.requestSemaphore.release();
    }
  }

  private async withRetryOnAuth(operation: () => Promise): Promise {
    try {
      return await operation();
    } catch (error) {
      if (this.isAuthError(error)) {
        await this.authSemaphore.acquire();
        try {
          await this.refreshToken();
          return await operation();
        } finally {
          this.authSemaphore.release();
        }
      }
      throw error;
    }
  }
}
```

The semaphore pattern ensures that authentication operations are serialized while allowing controlled concurrency for regular requests[5]. This prevents both race conditions and resource exhaustion under high load.

### Promise-Based Request Coordination

Advanced implementations utilize promise coordination to manage the relationship between authentication state and pending requests[4][11]. This pattern queues failed requests and retries them after successful authentication.

```typescript
interface QueuedRequest {
  operation: () => Promise;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retryCount: number;
  maxRetries: number;
}

class PromiseCoordinatedAuthClient {
  private pendingRequests: QueuedRequest[] = [];
  private isRefreshing = false;

  async request(operation: () => Promise): Promise {
    return new Promise((resolve, reject) => {
      this.executeRequest({
        operation,
        resolve,
        reject,
        retryCount: 0,
        maxRetries: 1
      });
    });
  }

  private async executeRequest(request: QueuedRequest): Promise {
    try {
      const result = await request.operation();
      request.resolve(result);
    } catch (error) {
      if (this.isAuthError(error) && request.retryCount  {
    this.pendingRequests.push(request);

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      try {
        await this.refreshToken();
        await this.processPendingRequests();
      } catch (error) {
        this.rejectPendingRequests(error);
      } finally {
        this.isRefreshing = false;
        this.pendingRequests = [];
      }
    }
  }

  private async processPendingRequests(): Promise {
    const requests = [...this.pendingRequests];

    for (const request of requests) {
      request.retryCount++;
      this.executeRequest(request);
    }
  }
}
```

This coordination pattern ensures that all requests waiting for authentication are properly handled once the token refresh completes, preventing lost requests and maintaining request ordering[11].

## Request Buffer and Circuit Breaker Patterns

### Bounded Request Buffering

Implementing bounded request buffers prevents memory exhaustion while providing graceful degradation under high load conditions[16][19]. The buffer should have configurable size limits and clear policies for handling overflow scenarios.

```typescript
interface RequestBuffer {
  add(request: QueuedRequest): boolean;
  processNext(): Promise;
  clear(): void;
  size(): number;
  isFull(): boolean;
}

class BoundedRequestBuffer implements RequestBuffer {
  private buffer: QueuedRequest[] = [];
  private processing = false;

  constructor(
    private maxSize: number = 50,
    private overflowStrategy: "reject" | "drop-oldest" = "reject"
  ) {}

  add(request: QueuedRequest): boolean {
    if (this.isFull()) {
      if (this.overflowStrategy === "drop-oldest") {
        const dropped = this.buffer.shift();
        dropped?.reject(new Error("Request dropped due to buffer overflow"));
      } else {
        request.reject(new Error("Request buffer full"));
        return false;
      }
    }

    this.buffer.push(request);
    this.processIfIdle();
    return true;
  }

  private async processIfIdle(): Promise {
    if (this.processing || this.buffer.length === 0) return;

    this.processing = true;
    try {
      while (this.buffer.length > 0) {
        const request = this.buffer.shift()!;
        await this.executeRequest(request);
      }
    } finally {
      this.processing = false;
    }
  }

  private async executeRequest(request: QueuedRequest): Promise {
    try {
      const result = await request.operation();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }
  }

  isFull(): boolean {
    return this.buffer.length >= this.maxSize;
  }

  size(): number {
    return this.buffer.length;
  }
}
```

The bounded buffer implementation provides configurable overflow strategies and prevents unbounded memory growth while maintaining FIFO ordering for queued requests[16][20].

### Circuit Breaker Implementation

Circuit breakers provide protection against cascading failures and automatic recovery mechanisms[7][17]. They monitor failure rates and temporarily halt operations when failure thresholds are exceeded.

```typescript
enum CircuitState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half-open",
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxAttempts: number;
}

class AuthenticationCircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute(operation: () => Promise): Promise {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptRecovery()) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenAttempts = 0;
      } else {
        throw new Error("Circuit breaker is OPEN - service unavailable");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptRecovery(): boolean {
    const timeSinceFailure = Date.now() - this.lastFailureTime;
    return timeSinceFailure > this.config.recoveryTimeout;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    this.halfOpenAttempts = 0;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
```

The circuit breaker monitors authentication failures and provides automatic recovery mechanisms, preventing continuous failed attempts while allowing periodic recovery probes[7][17].

### Exponential Backoff with Jitter

Implementing exponential backoff with jitter prevents thundering herd problems and improves system stability during recovery periods[8][9].

```typescript
interface BackoffConfig {
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  jitter: boolean;
  maxAttempts: number;
}

class ExponentialBackoffRetry {
  constructor(private config: BackoffConfig) {}

  async executeWithBackoff(
    operation: () => Promise,
    shouldRetry: (error: any) => boolean = () => true
  ): Promise {
    let lastError: any;

    for (let attempt = 1; attempt  {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

The exponential backoff implementation includes configurable jitter to distribute retry attempts across time, reducing load spikes during recovery periods[8][9].

## Authentication State Management

### State Machine Pattern Implementation

State machines provide explicit modeling of authentication states and valid transitions, preventing invalid state combinations[12][13][18]. This approach ensures that authentication flows are predictable and secure.

```typescript
type AuthenticationState =
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'refreshing'
  | 'refresh_failed'
  | 'logged_out';

type AuthenticationEvent =
  | { type: 'LOGIN_START'; credentials: AuthCredentials }
  | { type: 'LOGIN_SUCCESS'; user: User; tokens: TokenPair }
  | { type: 'LOGIN_FAILURE'; error: AuthError }
  | { type: 'REFRESH_START' }
  | { type: 'REFRESH_SUCCESS'; tokens: TokenPair }
  | { type: 'REFRESH_FAILURE'; error: AuthError }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_EXPIRED' };

interface AuthContext {
  user: User | null;
  tokens: TokenPair | null;
  error: AuthError | null;
  retryCount: number;
}

class AuthenticationStateMachine {
  private state: AuthenticationState = 'unauthenticated';
  private context: AuthContext = {
    user: null,
    tokens: null,
    error: null,
    retryCount: 0
  };

  private transitions: Record>> = {
    unauthenticated: {
      LOGIN_START: 'authenticating'
    },
    authenticating: {
      LOGIN_SUCCESS: 'authenticated',
      LOGIN_FAILURE: 'unauthenticated'
    },
    authenticated: {
      TOKEN_EXPIRED: 'refreshing',
      LOGOUT: 'logged_out'
    },
    refreshing: {
      REFRESH_SUCCESS: 'authenticated',
      REFRESH_FAILURE: 'refresh_failed'
    },
    refresh_failed: {
      LOGIN_START: 'authenticating',
      LOGOUT: 'logged_out'
    },
    logged_out: {
      LOGIN_START: 'authenticating'
    }
  };

  send(event: AuthenticationEvent): void {
    const allowedTransitions = this.transitions[this.state];
    const targetState = allowedTransitions?.[event.type];

    if (!targetState) {
      console.warn(`Invalid transition: ${event.type} from ${this.state}`);
      return;
    }

    this.performTransition(event, targetState);
  }

  private performTransition(event: AuthenticationEvent, targetState: AuthenticationState): void {
    // Execute entry actions based on the transition
    this.executeActions(event, targetState);

    // Update state
    this.state = targetState;

    // Notify observers
    this.notifyStateChange();
  }

  private executeActions(event: AuthenticationEvent, targetState: AuthenticationState): void {
    switch (event.type) {
      case 'LOGIN_SUCCESS':
        this.context.user = event.user;
        this.context.tokens = event.tokens;
        this.context.error = null;
        this.context.retryCount = 0;
        break;

      case 'REFRESH_SUCCESS':
        this.context.tokens = event.tokens;
        this.context.error = null;
        this.context.retryCount = 0;
        break;

      case 'LOGIN_FAILURE':
      case 'REFRESH_FAILURE':
        this.context.error = event.error;
        this.context.retryCount++;
        break;

      case 'LOGOUT':
        this.context.user = null;
        this.context.tokens = null;
        this.context.error = null;
        this.context.retryCount = 0;
        break;
    }
  }

  getState(): AuthenticationState {
    return this.state;
  }

  getContext(): AuthContext {
    return { ...this.context };
  }

  canTransition(eventType: AuthenticationEvent['type']): boolean {
    return eventType in (this.transitions[this.state] || {});
  }
}
```

The state machine implementation ensures that authentication state transitions are explicit and valid, preventing common issues like attempting to refresh tokens when not authenticated[12][13][18].

### Credential Storage and Security

Secure credential storage requires careful consideration of security implications and fallback strategies. The implementation should support multiple storage backends with appropriate security measures.

```typescript
interface CredentialStore {
  store(key: string, value: string): Promise;
  retrieve(key: string): Promise;
  remove(key: string): Promise;
  clear(): Promise;
}

class SecureCredentialManager {
  constructor(
    private store: CredentialStore,
    private encryptionKey?: string
  ) {}

  async storeCredentials(credentials: {
    accessToken: string;
    refreshToken: string;
    username?: string; // For fallback authentication
    encryptedPassword?: string; // Encrypted, for fallback only
  }): Promise {
    await Promise.all([
      this.store.store("access_token", credentials.accessToken),
      this.store.store("refresh_token", credentials.refreshToken),
      credentials.username &&
        this.store.store("username", credentials.username),
      credentials.encryptedPassword &&
        this.store.store("encrypted_password", credentials.encryptedPassword),
    ]);
  }

  async getStoredCredentials(): Promise {
    const [accessToken, refreshToken, username, encryptedPassword] =
      await Promise.all([
        this.store.retrieve("access_token"),
        this.store.retrieve("refresh_token"),
        this.store.retrieve("username"),
        this.store.retrieve("encrypted_password"),
      ]);

    return {
      accessToken,
      refreshToken,
      username,
      encryptedPassword,
    };
  }

  async clearCredentials(): Promise {
    await this.store.clear();
  }

  // Security considerations for fallback authentication
  async canUseFallbackAuth(): Promise {
    const { username, encryptedPassword } = await this.getStoredCredentials();
    return !!(username && encryptedPassword);
  }
}

// Example implementation with different storage backends
class BrowserCredentialStore implements CredentialStore {
  async store(key: string, value: string): Promise {
    // Use secure storage (localStorage with encryption or sessionStorage)
    // Never store passwords in plain text
    if (key === "encrypted_password") {
      // Additional encryption layer for sensitive data
      const encrypted = await this.encrypt(value);
      sessionStorage.setItem(key, encrypted);
    } else {
      sessionStorage.setItem(key, value);
    }
  }

  async retrieve(key: string): Promise {
    const value = sessionStorage.getItem(key);
    if (!value) return null;

    if (key === "encrypted_password") {
      return await this.decrypt(value);
    }

    return value;
  }

  async remove(key: string): Promise {
    sessionStorage.removeItem(key);
  }

  async clear(): Promise {
    const keysToRemove = [
      "access_token",
      "refresh_token",
      "username",
      "encrypted_password",
    ];
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }

  private async encrypt(value: string): Promise {
    // Implement proper encryption - this is a placeholder
    return btoa(value);
  }

  private async decrypt(value: string): Promise {
    // Implement proper decryption - this is a placeholder
    return atob(value);
  }
}
```

The credential management system provides secure storage with encryption capabilities and supports fallback authentication while minimizing security risks.

## Network Resilience and Recovery

### Network Error Detection and Recovery

Distinguishing between network errors and authentication errors is crucial for implementing appropriate recovery strategies. Network issues require different handling than authentication failures.

```typescript
enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  SERVER = 'server',
  CLIENT = 'client',
  TIMEOUT = 'timeout'
}

interface ClassifiedError {
  type: ErrorType;
  originalError: Error;
  isRetryable: boolean;
  suggestedDelay?: number;
}

class NetworkErrorClassifier {
  classifyError(error: any): ClassifiedError {
    // Network connectivity issues
    if (this.isNetworkError(error)) {
      return {
        type: ErrorType.NETWORK,
        originalError: error,
        isRetryable: true,
        suggestedDelay: 5000 // 5 second delay for network issues
      };
    }

    // Authentication errors (401, 403)
    if (this.isAuthError(error)) {
      return {
        type: ErrorType.AUTHENTICATION,
        originalError: error,
        isRetryable: true,
        suggestedDelay: 0 // Immediate retry after auth refresh
      };
    }

    // Server errors (5xx)
    if (this.isServerError(error)) {
      return {
        type: ErrorType.SERVER,
        originalError: error,
        isRetryable: true,
        suggestedDelay: 10000 // 10 second delay for server issues
      };
    }

    // Timeout errors
    if (this.isTimeoutError(error)) {
      return {
        type: ErrorType.TIMEOUT,
        originalError: error,
        isRetryable: true,
        suggestedDelay: 2000 // 2 second delay for timeouts
      };
    }

    // Client errors (4xx, excluding auth)
    return {
      type: ErrorType.CLIENT,
      originalError: error,
      isRetryable: false
    };
  }

  private isNetworkError(error: any): boolean {
    return (
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('network') ||
      error.message?.includes('fetch')
    );
  }

  private isAuthError(error: any): boolean {
    return error.status === 401 || error.status === 403;
  }

  private isServerError(error: any): boolean {
    return error.status >= 500 && error.status (operation: () => Promise): Promise {
    return this.backoffRetry.executeWithBackoff(
      operation,
      (error) => this.shouldRetryError(error)
    );
  }

  private shouldRetryError(error: any): boolean {
    const classified = this.errorClassifier.classifyError(error);

    switch (classified.type) {
      case ErrorType.NETWORK:
      case ErrorType.SERVER:
      case ErrorType.TIMEOUT:
        return true;

      case ErrorType.AUTHENTICATION:
        // Handle auth errors separately
        return this.handleAuthError(error);

      default:
        return false;
    }
  }

  private async handleAuthError(error: any): Promise {
    try {
      await this.authManager.refreshToken();
      return true; // Retry after successful refresh
    } catch (refreshError) {
      // If refresh fails, don't retry
      return false;
    }
  }
}
```

The network error classification system provides intelligent retry logic based on error types, ensuring appropriate handling for different failure scenarios.

### Connection Monitoring and Recovery

Implementing connection monitoring enables automatic recovery when network connectivity is restored.

```typescript
class ConnectionMonitor {
  private isOnline = navigator.onLine;
  private listeners: Array void> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.reconnectAttempts = 0;
    this.notifyListeners(true);
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.notifyListeners(false);
  }

  private notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => listener(online));
  }

  onConnectionChange(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async waitForConnection(): Promise {
    if (this.isOnline) return;

    return new Promise((resolve) => {
      const unsubscribe = this.onConnectionChange((online) => {
        if (online) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }
}

class NetworkAwareHttpClient {
  private pendingRequests: QueuedRequest[] = [];
  private connectionMonitor = new ConnectionMonitor();

  constructor(private baseClient: HttpClient) {
    this.connectionMonitor.onConnectionChange((online) => {
      if (online) {
        this.processPendingRequests();
      }
    });
  }

  async request(operation: () => Promise): Promise {
    if (!this.connectionMonitor.getConnectionStatus()) {
      return this.queueRequest(operation);
    }

    try {
      return await operation();
    } catch (error) {
      if (this.isNetworkError(error)) {
        await this.connectionMonitor.waitForConnection();
        return await operation(); // Retry after connection restored
      }
      throw error;
    }
  }

  private async queueRequest(operation: () => Promise): Promise {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({
        operation,
        resolve,
        reject,
        retryCount: 0,
        maxRetries: 3
      });
    });
  }

  private async processPendingRequests(): Promise {
    const requests = [...this.pendingRequests];
    this.pendingRequests = [];

    for (const request of requests) {
      try {
        const result = await request.operation();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }
  }

  private isNetworkError(error: any): boolean {
    return (
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      !navigator.onLine
    );
  }
}
```

The connection monitoring system automatically queues requests during offline periods and processes them when connectivity is restored, providing seamless user experience during network interruptions.

## TypeScript Implementation Patterns

### Type-Safe Error Handling

Implementing comprehensive type-safe error handling ensures that all error scenarios are properly handled at compile time.

```typescript
// Define discriminated union types for different error scenarios
type AuthError =
  | { type: 'INVALID_CREDENTIALS'; message: string }
  | { type: 'TOKEN_EXPIRED'; expiredAt: Date }
  | { type: 'REFRESH_FAILED'; reason: string }
  | { type: 'NETWORK_ERROR'; networkDetails: NetworkError }
  | { type: 'RATE_LIMITED'; retryAfter: number };

type NetworkError = {
  code: string;
  message: string;
  timeout?: boolean;
};

// Result type for operations that can fail
type Result =
  | { success: true; data: T }
  | { success: false; error: E };

// Type-safe authentication client with comprehensive error handling
class TypeSafeAuthClient {
  async login(credentials: AuthCredentials): Promise> {
    try {
      const response = await this.httpClient.post('/auth/login', credentials);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.classifyAuthError(error) };
    }
  }

  async refreshToken(refreshToken: string): Promise> {
    try {
      const response = await this.httpClient.post('/auth/refresh', { refresh_token: refreshToken });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.classifyAuthError(error) };
    }
  }

  private classifyAuthError(error: any): AuthError {
    if (error.status === 401) {
      return { type: 'INVALID_CREDENTIALS', message: 'Invalid username or password' };
    }

    if (error.status === 429) {
      const retryAfter = parseInt(error.headers['retry-after']) || 60;
      return { type: 'RATE_LIMITED', retryAfter };
    }

    if (this.isNetworkError(error)) {
      return {
        type: 'NETWORK_ERROR',
        networkDetails: {
          code: error.code,
          message: error.message,
          timeout: error.timeout
        }
      };
    }

    return { type: 'REFRESH_FAILED', reason: error.message || 'Unknown error' };
  }

  // Usage example with exhaustive error handling
  async authenticateWithFallback(credentials: AuthCredentials): Promise> {
    const loginResult = await this.login(credentials);

    if (!loginResult.success) {
      // TypeScript ensures all error cases are handled
      switch (loginResult.error.type) {
        case 'INVALID_CREDENTIALS':
          return { success: false, error: `Login failed: ${loginResult.error.message}` };

        case 'RATE_LIMITED':
          return { success: false, error: `Rate limited. Retry after ${loginResult.error.retryAfter} seconds` };

        case 'NETWORK_ERROR':
          return { success: false, error: `Network error: ${loginResult.error.networkDetails.message}` };

        case 'TOKEN_EXPIRED':
        case 'REFRESH_FAILED':
          return { success: false, error: 'Authentication service error' };
      }
    }

    return { success: true, data: loginResult.data.user };
  }
}
```

The type-safe implementation ensures that all error scenarios are handled at compile time, preventing runtime errors and improving reliability.

### Functional Programming Patterns

Leveraging functional programming patterns provides composable and testable authentication logic.

```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';

// Functional approach to authentication with TaskEither for error handling
type AuthResult = TE.TaskEither;

class FunctionalAuthClient {
  // Composable authentication operations
  login = (credentials: AuthCredentials): AuthResult =>
    TE.tryCatch(
      () => this.httpClient.post('/auth/login', credentials),
      (error) => this.classifyAuthError(error)
    );

  refreshToken = (refreshToken: string): AuthResult =>
    TE.tryCatch(
      () => this.httpClient.post('/auth/refresh', { refresh_token: refreshToken }),
      (error) => this.classifyAuthError(error)
    );

  validateToken = (token: string): AuthResult =>
    TE.tryCatch(
      () => this.httpClient.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      (error) => this.classifyAuthError(error)
    );

  // Composable authentication flow with automatic retry and fallback
  authenticateWithRetry = (
    credentials: AuthCredentials,
    maxRetries: number = 3
  ): AuthResult => {
    const attemptLogin = (attempt: number): AuthResult =>
      pipe(
        this.login(credentials),
        TE.orElse((error) => {
          if (attempt  attemptLogin(attempt + 1))
            );
          }
          return TE.left(error);
        })
      );

    return attemptLogin(1);
  };

  // Composable request with authentication
  authenticatedRequest = (
    request: () => Promise
  ): AuthResult =>
    pipe(
      this.getCurrentToken(),
      TE.chain((token) =>
        TE.tryCatch(
          () => this.addAuthHeader(request, token),
          (error) => this.classifyAuthError(error)
        )
      ),
      TE.orElse((error) => {
        if (error.type === 'TOKEN_EXPIRED') {
          return pipe(
            this.refreshCurrentToken(),
            TE.chain(() =>
              TE.tryCatch(
                () => request(),
                (error) => this.classifyAuthError(error)
              )
            )
          );
        }
        return TE.left(error);
      })
    );

  private getCurrentToken = (): AuthResult =>
    TE.fromEither(
      this.state.currentAuthToken
        ? E.right(this.state.currentAuthToken)
        : E.left({ type: 'TOKEN_EXPIRED' as const, expiredAt: new Date() })
    );

  private refreshCurrentToken = (): AuthResult =>
    pipe(
      TE.fromEither(
        this.state.currentRefreshToken
          ? E.right(this.state.currentRefreshToken)
          : E.left({ type: 'REFRESH_FAILED' as const, reason: 'No refresh token available' })
      ),
      TE.chain((refreshToken) => this.refreshToken(refreshToken)),
      TE.map((tokens) => {
        this.state.currentAuthToken = tokens.access_token;
        this.state.currentRefreshToken = tokens.refresh_token;
        return tokens;
      })
    );

  private calculateBackoffDelay = (attempt: number): number =>
    Math.min(1000 * Math.pow(2, attempt), 30000);

  private isRetryableError = (error: AuthError): boolean =>
    error.type === 'NETWORK_ERROR' || error.type === 'RATE_LIMITED';
}
```

The functional programming approach provides composable operations with built-in error handling and retry logic, making the authentication flow more predictable and testable.

## HTTP Client Architecture Patterns

### Interceptor Pattern Implementation

Interceptors provide a clean way to implement cross-cutting concerns like authentication, logging, and error handling without modifying individual request methods.

```typescript
interface RequestInterceptor {
  onRequest?(config: RequestConfig): Promise | RequestConfig;
  onResponse?(response: HttpResponse): Promise> | HttpResponse;
  onError?(error: any): Promise | any;
}

interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record;
  data?: any;
  timeout?: number;
  retryCount?: number;
}

class InterceptableHttpClient {
  private interceptors: RequestInterceptor[] = [];

  addInterceptor(interceptor: RequestInterceptor): () => void {
    this.interceptors.push(interceptor);

    // Return removal function
    return () => {
      const index = this.interceptors.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.splice(index, 1);
      }
    };
  }

  async request(config: RequestConfig): Promise> {
    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors(config);

      // Make the actual request
      const response = await this.makeRequest(processedConfig);

      // Apply response interceptors
      return await this.applyResponseInterceptors(response);
    } catch (error) {
      // Apply error interceptors
      throw await this.applyErrorInterceptors(error);
    }
  }

  private async applyRequestInterceptors(config: RequestConfig): Promise {
    let processedConfig = config;

    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        processedConfig = await interceptor.onRequest(processedConfig);
      }
    }

    return processedConfig;
  }

  private async applyResponseInterceptors(response: HttpResponse): Promise> {
    let processedResponse = response;

    for (const interceptor of this.interceptors) {
      if (interceptor.onResponse) {
        processedResponse = await interceptor.onResponse(processedResponse);
      }
    }

    return processedResponse;
  }

  private async applyErrorInterceptors(error: any): Promise {
    let processedError = error;

    for (const interceptor of this.interceptors) {
      if (interceptor.onError) {
        try {
          processedError = await interceptor.onError(processedError);
        } catch (interceptorError) {
          processedError = interceptorError;
        }
      }
    }

    return processedError;
  }
}

// Authentication interceptor implementation
class AuthenticationInterceptor implements RequestInterceptor {
  constructor(
    private authManager: AuthManager,
    private circuitBreaker: AuthenticationCircuitBreaker
  ) {}

  async onRequest(config: RequestConfig): Promise {
    // Skip auth for login/refresh endpoints
    if (this.isAuthEndpoint(config.url)) {
      return config;
    }

    const token = await this.authManager.getValidToken();
    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`
        }
      };
    }

    return config;
  }

  async onError(error: any): Promise {
    if (error.status === 401 && !this.isAuthEndpoint(error.config?.url)) {
      return await this.circuitBreaker.execute(async () => {
        await this.authManager.refreshToken();

        // Retry the original request
        const retryConfig = {
          ...error.config,
          retryCount: (error.config.retryCount || 0) + 1
        };

        if (retryConfig.retryCount (response: HttpResponse): HttpResponse {
    console.log(`✅ [${new Date().toISOString()}] ${response.status} ${response.config?.url}`);
    return response;
  }

  onError(error: any): any {
    console.error(`❌ [${new Date().toISOString()}] ${error.status || 'Network Error'} ${error.config?.url}`);
    throw error;
  }
}

// Usage example
const httpClient = new InterceptableHttpClient();

// Add interceptors in order
const removeAuthInterceptor = httpClient.addInterceptor(
  new AuthenticationInterceptor(authManager, circuitBreaker)
);
const removeLoggingInterceptor = httpClient.addInterceptor(new LoggingInterceptor());
```

The interceptor pattern provides a flexible architecture for implementing cross-cutting concerns while maintaining separation of concerns and testability.

### Middleware Chain Pattern

Middleware chains provide a more advanced pattern for request processing, allowing complex request modification and error handling workflows.

```typescript
type MiddlewareFunction = (
  context: RequestContext,
  next: () => Promise
) => Promise;

interface RequestContext {
  config: RequestConfig;
  retryCount: number;
  startTime: number;
  metadata: Record;
}

class MiddlewareHttpClient {
  private middleware: MiddlewareFunction[] = [];

  use(middleware: MiddlewareFunction): void {
    this.middleware.push(middleware);
  }

  async request(config: RequestConfig): Promise {
    const context: RequestContext = {
      config,
      retryCount: 0,
      startTime: Date.now(),
      metadata: {}
    };

    return await this.executeMiddleware(context, 0);
  }

  private async executeMiddleware(
    context: RequestContext,
    index: number
  ): Promise {
    if (index >= this.middleware.length) {
      // Base case: execute the actual request
      return await this.makeRequest(context.config);
    }

    const middleware = this.middleware[index];
    const next = () => this.executeMiddleware(context, index + 1);

    return await middleware(context, next);
  }
}

// Authentication middleware
const authMiddleware: MiddlewareFunction = async (context, next) => {
  // Skip auth for public endpoints
  if (context.config.url.includes('/public/')) {
    return await next();
  }

  const token = await authManager.getValidToken();
  if (token) {
    context.config.headers = {
      ...context.config.headers,
      Authorization: `Bearer ${token}`
    };
  }

  try {
    return await next();
  } catch (error) {
    if (error.status === 401) {
      // Handle auth error and retry
      await authManager.refreshToken();
      context.retryCount++;

      if (context.retryCount  {
  const timeout = context.config.timeout || 30000;

  return await Promise.race([
    next(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

// Retry middleware with exponential backoff
const retryMiddleware: MiddlewareFunction = async (context, next) => {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 0; attempt  | null = null;
  private interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };

  constructor(private config: ClientConfig) {
    this.setupDefaultInterceptors();
  }

  private setupDefaultInterceptors(): void {
    // Request interceptor for adding auth headers
    this.interceptors.request.use(async (config) => {
      if (this.shouldSkipAuth(config)) {
        return config;
      }

      const token = await this.getOrRefreshToken();
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`
        }
      };
    });

    // Response interceptor for handling auth errors
    this.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.forceTokenRefresh();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return await this.request(originalRequest);
          } catch (refreshError) {
            // Handle refresh failure
            this.handleAuthFailure(refreshError);
            throw refreshError;
          }
        }

        throw error;
      }
    );
  }

  private async getOrRefreshToken(): Promise {
    const currentToken = this.tokenStorage.getAccessToken();

    if (currentToken && !this.isTokenExpired(currentToken)) {
      return currentToken;
    }

    return await this.forceTokenRefresh();
  }

  private async forceTokenRefresh(): Promise {
    // Use shared promise to prevent multiple concurrent refresh requests
    if (this.refreshTokenPromise) {
      return await this.refreshTokenPromise;
    }

    this.refreshTokenPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshTokenPromise;
      return newToken;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private async performTokenRefresh(): Promise {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.baseRequest({
      method: 'POST',
      url: '/auth/refresh',
      data: { refresh_token: refreshToken }
    });

    this.tokenStorage.setTokens(response.access_token, response.refresh_token);
    return response.access_token;
  }
}
```

This implementation addresses the race condition issue by using a shared promise for token refresh operations, similar to patterns found in popular libraries[4][10].

### Auth0 and OAuth2 Client Patterns

Enterprise authentication libraries implement sophisticated patterns for handling token lifecycle and security[13].

```typescript
// Auth0-inspired client with advanced features
class EnterpriseAuthClient {
  private tokenManager: TokenManager;
  private securityManager: SecurityManager;
  private connectionManager: ConnectionManager;

  constructor(config: EnterpriseConfig) {
    this.tokenManager = new TokenManager(config.tokenConfig);
    this.securityManager = new SecurityManager(config.securityConfig);
    this.connectionManager = new ConnectionManager(config.connectionConfig);
  }

  async authenticateUser(credentials: AuthCredentials): Promise {
    // Implement security checks
    await this.securityManager.validateCredentials(credentials);

    // Attempt authentication with circuit breaker protection
    return await this.connectionManager.executeWithCircuitBreaker(async () => {
      const authResponse = await this.performAuthentication(credentials);

      // Securely store tokens
      await this.tokenManager.storeTokens(authResponse.tokens);

      // Setup automatic token refresh
      this.tokenManager.scheduleTokenRefresh(authResponse.tokens.expires_in);

      return {
        user: authResponse.user,
        tokens: authResponse.tokens,
        permissions: authResponse.permissions,
      };
    });
  }

  async makeAuthenticatedRequest(request: RequestConfig): Promise {
    return await this.connectionManager.executeWithRetry(async () => {
      const token = await this.tokenManager.getValidToken();

      const authenticatedRequest = {
        ...request,
        headers: {
          ...request.headers,
          Authorization: `Bearer ${token}`,
          "X-Client-Version": this.getClientVersion(),
          "X-Request-ID": this.generateRequestId(),
        },
      };

      return await this.performRequest(authenticatedRequest);
    });
  }

  // Advanced token management with proactive refresh
  private setupProactiveTokenRefresh(): void {
    setInterval(async () => {
      const token = this.tokenManager.getCurrentToken();

      if (token && this.tokenManager.shouldRefreshProactively(token)) {
        try {
          await this.tokenManager.refreshToken();
        } catch (error) {
          console.warn("Proactive token refresh failed:", error);
          // Don't throw - let reactive refresh handle it
        }
      }
    }, 60000); // Check every minute
  }
}

class TokenManager {
  private proactiveRefreshThreshold = 0.8; // Refresh when 80% of token lifetime elapsed

  shouldRefreshProactively(token: AccessToken): boolean {
    const now = Date.now();
    const tokenAge = now - token.issued_at;
    const tokenLifetime = token.expires_in * 1000;

    return tokenAge > tokenLifetime * this.proactiveRefreshThreshold;
  }

  scheduleTokenRefresh(expiresIn: number): void {
    const refreshTime = expiresIn * 1000 * this.proactiveRefreshThreshold;

    setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        console.warn("Scheduled token refresh failed:", error);
      }
    }, refreshTime);
  }
}
```

Enterprise patterns emphasize proactive token management, comprehensive security measures, and robust error handling to ensure reliability in production environments.

### Performance Benchmarks and Optimizations

Performance considerations are crucial for authentication clients that handle high request volumes. Key optimizations include request pooling, token caching, and efficient queue management[16][20].

```typescript
interface PerformanceMetrics {
  requestsPerSecond: number;
  averageResponseTime: number;
  tokenRefreshFrequency: number;
  queueSize: number;
  errorRate: number;
}

class PerformanceOptimizedAuthClient {
  private performanceMetrics: PerformanceMetrics = {
    requestsPerSecond: 0,
    averageResponseTime: 0,
    tokenRefreshFrequency: 0,
    queueSize: 0,
    errorRate: 0
  };

  private requestQueue = new BoundedQueue(1000);
  private connectionPool = new ConnectionPool(10);
  private metricsCollector = new MetricsCollector();

  async processRequests(): Promise {
    // Process requests in batches for better throughput
    const batchSize = 10;
    const batch: QueuedRequest[] = [];

    while (batch.length  0) {
      await Promise.allSettled(
        batch.map(request => this.executeRequest(request))
      );
    }
  }

  private async executeRequest(request: QueuedRequest): Promise {
    const startTime = performance.now();

    try {
      const connection = await this.connectionPool.acquire();
      try {
        const result = await request.operation();
        request.resolve(result);
        this.metricsCollector.recordSuccess(performance.now() - startTime);
      } finally {
        this.connectionPool.release(connection);
      }
    } catch (error) {
      request.reject(error);
      this.metricsCollector.recordError(performance.now() - startTime);
    }
  }

  // Memory-efficient token storage with cleanup
  private tokenCache = new Map();
  private maxCacheSize = 1000;

  private manageCacheSize(): void {
    if (this.tokenCache.size > this.maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.tokenCache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      const toRemove = entries.slice(0, this.tokenCache.size - this.maxCacheSize);
      toRemove.forEach(([key]) => this.tokenCache.delete(key));
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
}

interface CachedToken {
  token: string;
  expiresAt: number;
  lastAccessed: number;
}

class ConnectionPool {
  private available: Connection[] = [];
  private busy: Set = new Set();
  private waitingQueue: Array void> = [];

  constructor(private maxConnections: number) {
    // Initialize connection pool
    for (let i = 0; i  {
    if (this.available.length > 0) {
      const connection = this.available.pop()!;
      this.busy.add(connection);
      return connection;
    }

    // Wait for available connection
    return new Promise((resolve) => {
      this.waitingQueue.push(resolve);
    });
  }

  release(connection: Connection): void {
    this.busy.delete(connection);

    if (this.waitingQueue.length > 0) {
      const waitingResolver = this.waitingQueue.shift()!;
      this.busy.add(connection);
      waitingResolver(connection);
    } else {
      this.available.push(connection);
    }
  }
}
```

Performance optimizations focus on efficient resource utilization, memory management, and batch processing to handle high request volumes while maintaining low latency.

## Testing and Reliability Patterns

### Unit Testing Race Conditions

Testing race conditions in authentication clients requires sophisticated mocking and concurrency simulation techniques.

```typescript
describe('AuthClient Race Conditions', () => {
  let authClient: AuthClient;
  let mockHttpClient: jest.Mocked;
  let refreshTokenSpy: jest.SpyInstance;

  beforeEach(() => {
    mockHttpClient = createMockHttpClient();
    authClient = new AuthClient(mockHttpClient);
    refreshTokenSpy = jest.spyOn(authClient, 'refreshToken');
  });

  it('should handle concurrent 401 errors with single refresh', async () => {
    // Setup: Token is expired, refresh will succeed
    mockHttpClient.get
      .mockRejectedValueOnce(new HttpError(401, 'Unauthorized'))
      .mockRejectedValueOnce(new HttpError(401, 'Unauthorized'))
      .mockRejectedValueOnce(new HttpError(401, 'Unauthorized'))
      .mockResolvedValueOnce({ data: 'success 1' })
      .mockResolvedValueOnce({ data: 'success 2' })
      .mockResolvedValueOnce({ data: 'success 3' });

    mockHttpClient.post
      .mockResolvedValueOnce({
        access_token: 'new_token',
        refresh_token: 'new_refresh'
      });

    // Execute: Make 3 concurrent requests that will all hit 401
    const requests = [
      authClient.get('/api/data1'),
      authClient.get('/api/data2'),
      authClient.get('/api/data3')
    ];

    const results = await Promise.all(requests);

    // Assert: All requests succeeded
    expect(results).toEqual([
      { data: 'success 1' },
      { data: 'success 2' },
      { data: 'success 3' }
    ]);

    // Assert: Refresh was called only once despite 3 concurrent 401s
    expect(refreshTokenSpy).toHaveBeenCalledTimes(1);

    // Assert: Each original request was retried exactly once
    expect(mockHttpClient.get).toHaveBeenCalledTimes(6); // 3 initial + 3 retries
  });

  it('should handle request queue overflow gracefully', async () => {
    const maxQueueSize = 5;
    authClient = new AuthClient(mockHttpClient, { maxQueueSize });

    // Setup: Simulate slow refresh that blocks queue processing
    mockHttpClient.post.mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    // Simulate initial 401 that triggers refresh
    mockHttpClient.get.mockRejectedValue(new HttpError(401, 'Unauthorized'));

    // Execute: Try to queue more requests than the limit
    const requests = Array.from({ length: 10 }, (_, i) =>
      authClient.get(`/api/data${i}`)
    );

    const results = await Promise.allSettled(requests);

    // Assert: Some requests were rejected due to queue overflow
    const rejectedCount = results.filter(r => r.status === 'rejected').length;
    expect(rejectedCount).toBeGreaterThan(0);

    // Assert: Queue size never exceeded the limit
    expect(authClient.getQueueSize()).toBeLessThanOrEqual(maxQueueSize);
  });

  it('should handle network interruption and recovery', async () => {
    const connectionMonitor = new MockConnectionMonitor();
    authClient = new AuthClient(mockHttpClient, { connectionMonitor });

    // Setup: Start offline
    connectionMonitor.setOnline(false);

    // Execute: Make requests while offline
    const offlineRequest = authClient.get('/api/data');

    // Verify request is queued, not executed
    expect(mockHttpClient.get).not.toHaveBeenCalled();

    // Simulate connection recovery
    connectionMonitor.setOnline(true);
    mockHttpClient.get.mockResolvedValueOnce({ data: 'success' });

    const result = await offlineRequest;

    // Assert: Request succeeded after connection recovery
    expect(result).toEqual({ data: 'success' });
    expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
  });
});

// Mock utilities for testing
class MockConnectionMonitor {
  private online = true;
  private listeners: Array void> = [];

  setOnline(online: boolean): void {
    this.online = online;
    this.listeners.forEach(listener => listener(online));
  }

  onConnectionChange(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  getConnectionStatus(): boolean {
    return this.online;
  }
}

// Property-based testing for edge cases
describe('AuthClient Property Tests', () => {
  it('should maintain token consistency under concurrent load', async () => {
    fc.assert(fc.asyncProperty(
      fc.array(fc.integer(1, 100), { minLength: 1, maxLength: 50 }),
      async (requestCounts) => {
        const authClient = new AuthClient(mockHttpClient);

        // Generate concurrent requests based on property
        const allRequests = requestCounts.flatMap(count =>
          Array.from({ length: count }, () => authClient.get('/api/test'))
        );

        const results = await Promise.allSettled(allRequests);

        // Property: Either all requests succeed or all fail consistently
        const successes = results.filter(r => r.status === 'fulfilled').length;
        const failures = results.filter(r => r.status === 'rejected').length;

        // If any request succeeded, the token refresh must have worked
        if (successes > 0) {
          expect(authClient.hasValidToken()).toBe(true);
        }

        // Token refresh should be called at most once regardless of concurrent load
        expect(refreshTokenSpy).toHaveBeenCalledTimes(1);
      }
    ));
  });
});
```

The testing approach covers race conditions, queue overflow scenarios, and network interruption recovery, ensuring the authentication client handles edge cases correctly.

### Integration Testing with Network Simulation

Integration tests validate the authentication client's behavior under realistic network conditions and service interactions.

```typescript
describe("AuthClient Integration Tests", () => {
  let testServer: TestServer;
  let authClient: AuthClient;

  beforeAll(async () => {
    testServer = new TestServer();
    await testServer.start();
  });

  afterAll(async () => {
    await testServer.stop();
  });

  beforeEach(() => {
    authClient = new AuthClient({
      baseURL: testServer.getURL(),
      timeout: 5000,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 100,
      },
    });
  });

  it("should handle authentication flow with real network delays", async () => {
    // Setup: Configure server responses with realistic delays
    testServer.addRoute("POST", "/auth/login", {
      delay: 500,
      response: {
        access_token: "test_token",
        refresh_token: "test_refresh",
        expires_in: 3600,
      },
    });

    testServer.addRoute("GET", "/api/protected", {
      requiresAuth: true,
      response: { data: "protected_data" },
    });

    // Execute: Full authentication flow
    await authClient.login({ username: "test", password: "test" });
    const result = await authClient.get("/api/protected");

    // Assert: Authentication and request succeeded
    expect(result.data).toBe("protected_data");
  });

  it("should handle token refresh during high concurrent load", async () => {
    // Setup: Short-lived token that will expire during test
    testServer.addRoute("POST", "/auth/login", {
      response: {
        access_token: "short_token",
        refresh_token: "test_refresh",
        expires_in: 1, // 1 second expiration
      },
    });

    testServer.addRoute("POST", "/auth/refresh", {
      delay: 200, // Simulate network delay
      response: {
        access_token: "new_token",
        refresh_token: "new_refresh",
        expires_in: 3600,
      },
    });

    testServer.addRoute("GET", "/api/data", {
      requiresAuth: true,
      response: { data: "test_data" },
    });

    // Execute: Login and wait for token expiration
    await authClient.login({ username: "test", password: "test" });
    await sleep(1100); // Wait for token to expire

    // Make many concurrent requests
    const requests = Array.from({ length: 20 }, () =>
      authClient.get("/api/data")
    );

    const results = await Promise.all(requests);

    // Assert: All requests succeeded despite token expiration
    expect(results).toHaveLength(20);
    results.forEach((result) => {
      expect(result.data).toBe("test_data");
    });

    // Assert: Token refresh was called only once
    expect(testServer.getCallCount("POST", "/auth/refresh")).toBe(1);
  });

  it("should recover from network interruptions", async () => {
    // Setup: Simulate network failure and recovery
    testServer.addRoute("GET", "/api/data", {
      responses: [
        { error: "ECONNREFUSED", count: 3 }, // First 3 calls fail
        { response: { data: "success" } }, // 4th call succeeds
      ],
    });

    // Execute: Request with automatic retry
    const result = await authClient.get("/api/data");

    // Assert: Request eventually succeeded
    expect(result.data).toBe("success");
    expect(testServer.getCallCount("GET", "/api/data")).toBe(4);
  });
});

// Test server implementation for realistic network simulation
class TestServer {
  private server: http.Server;
  private routes: Map = new Map();
  private callCounts: Map = new Map();

  async start(port = 0): Promise {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return new Promise((resolve) => {
      this.server.listen(port, () => resolve());
    });
  }

  addRoute(method: string, path: string, config: RouteConfig): void {
    const key = `${method}:${path}`;
    this.routes.set(key, config);
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise {
    const key = `${req.method}:${req.url}`;
    const config = this.routes.get(key);

    if (!config) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    // Track call count
    this.callCounts.set(key, (this.callCounts.get(key) || 0) + 1);

    // Handle authentication requirement
    if (config.requiresAuth && !this.isAuthenticated(req)) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    // Simulate network delay
    if (config.delay) {
      await sleep(config.delay);
    }

    // Handle error responses
    if (config.error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: config.error }));
      return;
    }

    // Send success response
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(config.response));
  }

  getCallCount(method: string, path: string): number {
    return this.callCounts.get(`${method}:${path}`) || 0;
  }
}
```

Integration testing provides confidence that the authentication client works correctly under realistic conditions with actual network delays and service interactions.

## Conclusion

The research reveals that robust authentication and request management in TypeScript HTTP clients requires a multi-layered approach combining several key patterns and techniques. The most critical finding is that effective race condition prevention depends on implementing single-flight token refresh patterns using promise deduplication, which ensures only one refresh operation occurs regardless of concurrent request volume[2][4]. This approach, combined with bounded request queuing and configurable overflow strategies, provides reliable operation under high concurrent loads while preventing memory exhaustion[16][19].

State machine patterns emerge as essential for managing authentication state transitions, providing explicit modeling of valid states and preventing invalid state combinations that can lead to security vulnerabilities[12][13][18]. The integration of circuit breaker patterns with exponential backoff and jitter further enhances system resilience by providing automatic recovery mechanisms and preventing thundering herd problems during service restoration[7][8][17].

The comprehensive solution architecture should incorporate interceptor patterns for cross-cutting concerns, functional programming approaches for composable error handling, and sophisticated error classification systems that distinguish between network, authentication, and server errors[4][10]. Performance considerations require connection pooling, efficient queue management, and proactive token refresh strategies to maintain low latency under high request volumes. Testing strategies must include property-based testing for edge cases, network simulation for integration testing, and comprehensive mocking for race condition validation to ensure reliability in production environments.

Citations:
[1] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/71697354/f82208e1-27e2-44d6-9910-41b3b21bfb70/paste.txt
[2] https://stackoverflow.com/questions/60147313/send-only-one-refresh-jwt-request
[3] https://github.com/nuxt-community/auth-module/issues/1772
[4] https://gist.github.com/mkjiau/650013a99c341c9f23ca00ccb213db1c
[5] https://github.com/henrygd/semaphore
[6] https://docs.apify.com/sdk/js/reference/3.0/class/RequestQueue
[7] https://dev.to/moniv9/implement-circuit-breaker-in-javascript-3ihk
[8] https://www.npmjs.com/package/exponential-backoff
[9] https://www.npmjs.com/package/p-retry
[10] https://javascript.plainenglish.io/handle-refresh-token-with-axios-1e0f45e9afa
[11] https://stackoverflow.com/questions/45497552/js-promise-waitfor-refresh-token
[12] https://overmindjs.org/guides-1/using-state-machines
[13] https://xstatebyexample.com/authentication/
[14] https://www.donnywals.com/building-a-token-refresh-flow-with-async-await-and-swift-concurrency/
[15] https://community-forums.domo.com/main/discussion/28892/node-token-refresh-for-data-api-call
[16] https://dev.to/soorajsnblaze333/queuing-api-25oa
[17] https://learnersbucket.com/examples/interview/circuit-breaker-in-javascript/
[18] https://javascript.plainenglish.io/client-side-authentication-via-finite-state-machines-redux-and-redux-sagas-cd3e0e2bd9ab
[19] https://www.reddit.com/r/learnjavascript/comments/yo45h4/best_way_to_create_a_http_request_queue_handler/
[20] https://www.ccdatalab.org/blog/queueing-javascript-promises
[21] https://gist.github.com/pwrmind/9ecc7f146e6d71632e05911b1ef535c0
[22] https://github.com/nextauthjs/next-auth/discussions/3940
[23] https://www.reddit.com/r/node/comments/18r9nl9/understanding_refresh_tokens/
[24] https://security.stackexchange.com/questions/242918/when-to-request-refresh-token-jwt
[25] https://dev.to/tijan_io/access-token-and-refresh-token-a-comprehensive-guide-40g7
[26] https://docs.apify.com/sdk/js/docs/1.3/api/request-queue
[27] https://www.prisma.io/blog/backend-prisma-typescript-orm-with-postgresql-auth-mngp1ps7kip4
[28] https://www.youtube.com/watch?v=BL3QQeOvqYo
[29] https://kentcdodds.com/blog/implementing-a-simple-state-machine-library-in-javascript
[30] https://dev.to/spukas/finite-state-machine-in-javascript-1ki1
[31] https://www.youtube.com/watch?v=XYjOteYbCMo
[32] https://www.treinaweb.com.br/blog/autenticacao-refresh-token-com-nestjs
[33] https://www.youtube.com/watch?v=xMsJPnjiRAc
[34] https://stackoverflow.com/a/62595659/3001761
[35] https://stackoverflow.com/questions/62781249/use-a-semaphore-to-fix-a-concurrency-issue
[36] https://stackoverflow.com/questions/79454397/access-token-doesnt-change-on-ky-retry-request
[37] https://developer.goto.com/guides/Authentication/05_HOW_refreshToken
[38] https://stackoverflow.com/questions/60364199/how-can-i-do-refresh-auth-token-logi%D1%81-with-axios-for-multiple-requests
[39] https://github.com/eram/typescript-fsm
[40] https://github.com/SoEasy/tstate-machine
[41] https://dev.to/derp/state-monad-in-fp-ts-5c79
[42] https://dzone.com/articles/type-safe-state-machines-in-typescript

---

Answer from Perplexity: pplx.ai/share
