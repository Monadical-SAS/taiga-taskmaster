# Research Query: Robust Authentication and Request Management Patterns

## Context

I'm working on a TypeScript HTTP client for API authentication that currently has basic token refresh capabilities but suffers from race conditions and lacks sophisticated error handling. The client uses:

- Bearer token authentication with refresh tokens
- Effect Schema for validation
- undici for HTTP requests
- Functional programming patterns

## Current Implementation Analysis

### Authentication State Management (Lines 200-240)

```typescript
const createAuthService = (
  client: HttpClient
): [AuthService, () => Promise<void>, () => AuthToken | null] => {
  const state = {
    currentRefreshToken: null as RefreshToken | null,
    currentAuthToken: null as AuthToken | null,
  };

  // Login stores both tokens in state
  const api = {
    login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
      const response = await client.post("/api/v1/auth", credentials);
      const authResponse = Schema.decodeUnknownSync(AuthResponse)(
        response.data
      );
      return {
        ...authResponse,
        refresh: (() => {
          state.currentRefreshToken = authResponse.refresh;
          return authResponse.refresh;
        })(),
        auth_token: (() => {
          state.currentAuthToken = authResponse.auth_token;
          return authResponse.auth_token;
        })(),
      };
    },

    refresh: async (refreshToken: RefreshRequest): Promise<RefreshResponse> => {
      console.log(`🔄 [${new Date().toISOString()}] Refreshing auth token...`);
      const response = await client.post("/api/v1/auth/refresh", refreshToken);
      const refreshResponse = Schema.decodeUnknownSync(RefreshResponse)(
        response.data
      );
      console.log(
        `✅ [${new Date().toISOString()}] Token refresh successful, new token received`
      );
      return {
        ...refreshResponse,
        refresh: (() => {
          state.currentRefreshToken = refreshResponse.refresh;
          return refreshResponse.refresh;
        })(),
        auth_token: (() => {
          state.currentAuthToken = refreshResponse.auth_token;
          return refreshResponse.auth_token;
        })(),
      };
    },
  };

  const refreshWithStoredToken = async (): Promise<void> => {
    if (!state.currentRefreshToken) {
      throw new Error("No refresh token available");
    }
    return api
      .refresh({ refresh: state.currentRefreshToken })
      .then(() => void 0);
  };

  const getAuthToken = (): AuthToken | null => state.currentAuthToken;

  return [api, refreshWithStoredToken, getAuthToken];
};
```

### Current Race Condition Problem (Lines 141-194)

```typescript
const createAuthenticatedHttpClient = (
  baseClient: HttpClient,
  getAuthToken: () => AuthToken | null,
  refreshAuth: () => Promise<void> // ❌ This is called by EVERY failed request simultaneously
): HttpClient => {
  const withAuthAndRetry = async (
    operation: () => Promise<HttpResponse<unknown>>
  ): Promise<HttpResponse<unknown>> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP 401")) {
        console.log(
          `🔄 [${new Date().toISOString()}] Token expired (401), attempting refresh...`
        );
        // ❌ RACE CONDITION: Multiple concurrent 401s will ALL call refreshAuth() simultaneously
        await refreshAuth();
        console.log(
          `✅ [${new Date().toISOString()}] Token refresh completed, retrying original request`
        );
        // ❌ NO QUEUING: All requests retry immediately after refresh, no coordination
        return await operation();
      }
      throw error;
    }
  };

  // Each service method wraps with withAuthAndRetry
  return {
    get: (
      path: string,
      options?: RequestOptions & { params?: Record<string, unknown> }
    ) => withAuthAndRetry(() => baseClient.get(path, addAuthHeader(options))), // ❌ Race condition here
    post: (path: string, data?: unknown, options?: RequestOptions) =>
      withAuthAndRetry(() =>
        baseClient.post(path, data, addAuthHeader(options))
      ), // ❌ And here
    // ... all methods have the same issue
  };
};
```

## Current Issues Identified

1. **Race Conditions**: Lines 154 - Multiple concurrent requests failing with 401 all trigger simultaneous `refreshAuth()` calls
2. **No Request Queuing**: Failed requests don't wait for ongoing refresh operations - they all retry immediately
3. **No Request Limiting**: Unlimited requests can pile up waiting for auth resolution
4. **Missing Fallback Strategy**: No fallback to username/password login when token refresh fails (state stores credentials but doesn't use them)
5. **Poor Network Error Handling**: No distinction between network errors vs auth errors, no retry when connectivity restored

### Missing Credential Storage for Fallback

```typescript
// Current: Only stores tokens, not original login credentials
const state = {
  currentRefreshToken: null as RefreshToken | null,
  currentAuthToken: null as AuthToken | null,
  // ❌ Missing: username/password for fallback when refresh fails
};
```

### Current Architecture Issues

```typescript
// Services use authenticated client but don't know about auth failures
const createTasksService = (client: HttpClient): TasksService => ({
  list: async (filters?: {
    project?: ProjectId;
    status?: StatusId;
    user_story?: UserStoryId;
  }): Promise<readonly TaskDetail[]> => {
    // ❌ This call might fail if 20+ other requests are waiting for auth
    const response = await client.get("/api/v1/tasks", { params: filters });
    return Schema.decodeUnknownSync(Schema.Array(TaskDetail))(response.data);
  },
  // ... other methods have same potential issues
});
```

### Required Solution Architecture

```typescript
// What we need to implement:
interface EnhancedAuthState {
  authStatus:
    | "unauthenticated"
    | "authenticating"
    | "authenticated"
    | "refresh_failed";
  currentAuthToken: AuthToken | null;
  currentRefreshToken: RefreshToken | null;
  originalCredentials: AuthCredentials | null; // For fallback
  refreshPromise: Promise<void> | null; // For deduplication
  requestQueue: Array<{
    operation: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    signal?: AbortSignal;
  }>;
  maxQueueSize: number; // e.g., 20 requests
}
```

## Research Topics Needed

### 1. Token Refresh Concurrency Control Patterns

- **Mutex/Lock patterns** for ensuring only one refresh operation at a time
- **Request queuing strategies** while refresh is in progress
- **Semaphore patterns** for limiting concurrent waiting requests (e.g., max 20 waiting, fail others)
- **Promise deduplication** techniques to avoid duplicate refresh calls
- Real-world examples in TypeScript/JavaScript HTTP clients

### 2. Request Buffer and Circuit Breaker Patterns

- **Request buffering strategies** with size limits
- **Circuit breaker patterns** for authentication failures
- **Exponential backoff** for retry mechanisms
- **Request prioritization** when buffer is full
- How to gracefully fail excess requests beyond buffer capacity

### 3. Authentication State Management

- **State machine patterns** for authentication states (unauthenticated, authenticating, authenticated, failed)
- **Credential storage patterns** for fallback authentication
- **Token lifecycle management** best practices
- **Security considerations** for storing credentials in memory

### 4. Network Resilience and Recovery

- **Network error detection** patterns vs authentication errors
- **Automatic retry strategies** when connectivity is restored
- **Connection pooling considerations** with authentication
- **Timeout and cancellation** handling during network issues
- **Progressive degradation** strategies

### 5. TypeScript Implementation Patterns

- **Effect-ts patterns** for error handling and state management
- **Functional programming approaches** to request queuing and authentication
- **Type-safe error handling** for different failure modes
- **Dependency injection patterns** for testability
- **Unit testing strategies** for network simulation and race conditions

### 6. HTTP Client Architecture Patterns

- **Interceptor patterns** for request/response modification
- **Middleware chains** for authentication, retry, and error handling
- **Request deduplication** techniques
- **AbortSignal coordination** across multiple requests
- **Resource cleanup** patterns

### 7. Real-World Examples and Libraries

- How libraries like **axios**, **got**, **ky** handle similar problems
- **Auth0**, **OAuth2** client implementation patterns
- **Enterprise-grade** HTTP client architectures
- **Performance benchmarks** for different approaches
- **Memory leak prevention** in long-running applications

### 8. Testing and Reliability Patterns

- **Unit testing approaches** for race conditions
- **Integration testing** with network simulation
- **Stress testing** with high concurrent request loads
- **Mocking strategies** for authentication services
- **Property-based testing** for edge cases

## Specific Implementation Questions

### Core Concurrency Questions

1. **Single-Flight Pattern**: What's the best pattern for implementing a "single-flight" token refresh that queues subsequent requests?

   ```typescript
   // Current problematic pattern:
   await refreshAuth(); // Multiple calls happening simultaneously

   // Need: How to ensure only ONE refresh happens, others wait?
   ```

2. **Bounded Request Buffer**: How to implement a bounded buffer for requests waiting on authentication without memory leaks?

   ```typescript
   // Scenario: 100 concurrent requests hit 401
   // Want: First 20 queue, others fail fast with clear error
   // Question: Best data structure and cleanup strategy?
   ```

3. **State Machine Design**: How to design the state transitions between different authentication states?

   ```typescript
   // Current: No state machine, just token presence check
   const authToken = getAuthToken();
   if (!authToken) {
     /* what to do? */
   }

   // Need: Proper state transitions with Effect-ts patterns
   ```

### Security and Fallback Questions

4. **Credential Storage Security**: What are the security implications of storing login credentials for fallback authentication?

   ```typescript
   // Want to store for fallback:
   originalCredentials: AuthCredentials | null;
   // Questions: Memory security, cleanup timing, encryption?
   ```

5. **Fallback Strategy**: When should fallback to username/password happen vs failing?

   ```typescript
   // Current: refresh fails → error
   if (!state.currentRefreshToken) {
     throw new Error("No refresh token available");
   }

   // Need: When to try login() with stored credentials?
   ```

### Network Resilience Questions

6. **AbortSignal Coordination**: What's the recommended approach for handling AbortSignal propagation through queued requests?

   ```typescript
   // Scenario: User cancels request that's queued for auth
   // Questions: How to properly cancel and clean up?
   const response = await client.get("/api/v1/tasks", {
     signal: userAbortSignal,
   });
   ```

7. **Network vs Auth Errors**: How to distinguish network errors from auth errors reliably?

   ```typescript
   // Current: Only checks HTTP 401
   if (error instanceof Error && error.message.includes("HTTP 401")) {

   // Need: How to detect network timeouts, DNS failures, etc?
   ```

8. **Recovery After Network Issues**: How to ensure the solution works reliably when network connectivity is restored?
   ```typescript
   // Scenario: Network goes down during token refresh
   // Questions: How to retry? How to know network is back?
   ```

### Performance and Testing Questions

9. **Queue Performance**: What are the performance implications of different queuing strategies under high load?

   ```typescript
   // Need research on: Array vs LinkedList vs other structures
   // Memory usage patterns, cleanup strategies
   ```

10. **Testing Race Conditions**: How to reliably test race conditions and concurrent authentication scenarios?
    ```typescript
    // Need patterns for:
    // - Simulating 50+ concurrent requests hitting 401
    // - Testing network failure during token refresh
    // - Validating queue limits work correctly
    // - Ensuring no memory leaks in long-running tests
    ```

## Expected Output Format

Please provide:

- **Code examples** in TypeScript where possible
- **Architecture diagrams** or detailed explanations of patterns
- **Pros and cons** of different approaches
- **Performance considerations** for each pattern
- **Security implications** and best practices
- **Real-world library examples** with links to their implementations
- **Testing strategies** specific to these patterns

This research will inform the implementation of a robust, production-ready authentication client that can handle high concurrent loads while maintaining reliability and security.
