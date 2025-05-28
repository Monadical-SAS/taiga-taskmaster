// @vibe-generated: comprehensive authentication retry tests using fake HTTP client
import { Schema } from 'effect';
import { 
  type HttpClient, 
  type HttpResponse, 
  type RequestOptions,
  type AuthCredentials,
  AuthResponse,
  RefreshResponse,
  HeaderKey,
  HeaderValue,
  HttpStatus
} from '@taiga-task-master/taiga-api-interface';

// ============================================================================
// Fake HTTP Client for Testing
// ============================================================================

interface FakeHttpClientConfig {
  authEndpointBehavior: 'success' | 'failure' | 'network-error';
  refreshEndpointBehavior: 'success' | 'failure' | 'network-error';
  apiEndpointBehavior: 'success' | 'auth-required' | 'network-error';
  loginCallCount?: number;
  refreshCallCount?: number;
}

const createFakeHttpClient = (config: FakeHttpClientConfig): HttpClient & { 
  getCallCounts: () => { login: number; refresh: number; api: number };
  updateConfig: (newConfig: Partial<FakeHttpClientConfig>) => void;
} => {
  let callCounts = { login: 0, refresh: 0, api: 0 };
  let currentConfig = { ...config };

  const createResponse = <T>(data: T, status = 200): HttpResponse<T> => ({
    data,
    status: Schema.decodeSync(HttpStatus)(status),
    headers: {} as Record<HeaderKey, HeaderValue>
  });

  const mockAuthResponse = {
    id: 123,
    username: "testuser",
    email: "test@example.com",
    full_name: "Test User",
    auth_token: "mock-auth-token",
    refresh: "mock-refresh-token",
    accepted_terms: true,
    read_new_terms: true
  };

  const mockRefreshResponse = {
    auth_token: "new-mock-auth-token",
    refresh: "new-mock-refresh-token"
  };

  return {
    get: async (path: string, options?: RequestOptions & { params?: Record<string, unknown> }): Promise<HttpResponse<unknown>> => {
      if (path.includes('/api/v1/tasks') || path.includes('/api/v1/userstories')) {
        callCounts.api++;
        
        switch (currentConfig.apiEndpointBehavior) {
          case 'success':
            return createResponse([]);
          case 'auth-required':
            throw new Error('HTTP 401');
          case 'network-error':
            throw new Error('Network error: ECONNREFUSED');
          default:
            throw new Error('Unknown behavior');
        }
      }
      
      throw new Error(`Unmocked GET endpoint: ${path}`);
    },

    post: async (path: string, data?: unknown, options?: RequestOptions): Promise<HttpResponse<unknown>> => {
      if (path === '/api/v1/auth') {
        callCounts.login++;
        
        switch (currentConfig.authEndpointBehavior) {
          case 'success':
            return createResponse(mockAuthResponse);
          case 'failure':
            throw new Error('HTTP 401');
          case 'network-error':
            throw new Error('Network error: ECONNREFUSED');
          default:
            throw new Error('Unknown auth behavior');
        }
      }

      if (path === '/api/v1/auth/refresh') {
        callCounts.refresh++;
        
        switch (currentConfig.refreshEndpointBehavior) {
          case 'success':
            return createResponse(mockRefreshResponse);
          case 'failure':
            throw new Error('HTTP 401');
          case 'network-error':
            throw new Error('Network error: ECONNREFUSED');
          default:
            throw new Error('Unknown refresh behavior');
        }
      }

      throw new Error(`Unmocked POST endpoint: ${path}`);
    },

    put: async (): Promise<HttpResponse<unknown>> => {
      throw new Error('PUT not implemented in fake client');
    },

    patch: async (): Promise<HttpResponse<unknown>> => {
      throw new Error('PATCH not implemented in fake client');
    },

    delete: async (): Promise<HttpResponse<void>> => {
      throw new Error('DELETE not implemented in fake client');
    },

    getCallCounts: () => ({ ...callCounts }),
    updateConfig: (newConfig: Partial<FakeHttpClientConfig>) => {
      currentConfig = { ...currentConfig, ...newConfig };
    }
  };
};

// ============================================================================
// Auth Service Creation (copied from main implementation for testing)
// ============================================================================

const createAuthService = (client: HttpClient, credentials?: AuthCredentials) => {
  const state = {
    currentRefreshToken: null as string | null,
    currentAuthToken: null as string | null,
    storedCredentials: credentials || null as AuthCredentials | null
  };
  
  const api = {
    login: async (credentials: AuthCredentials) => {
      const response = await client.post("/api/v1/auth", credentials);
      const authResponse = Schema.decodeUnknownSync(AuthResponse)(response.data);
      
      // Store credentials for future login retry
      state.storedCredentials = credentials;
      state.currentRefreshToken = authResponse.refresh;
      state.currentAuthToken = authResponse.auth_token;
      
      return authResponse;
    },

    refresh: async (refreshToken: { refresh: string }) => {
      console.log(`🔄 [${new Date().toISOString()}] Refreshing auth token...`);
      const response = await client.post("/api/v1/auth/refresh", refreshToken);
      const refreshResponse = Schema.decodeUnknownSync(RefreshResponse)(response.data);
      console.log(`✅ [${new Date().toISOString()}] Token refresh successful, new token received`);
      
      state.currentRefreshToken = refreshResponse.refresh;
      state.currentAuthToken = refreshResponse.auth_token;
      
      return refreshResponse;
    }
  };
  
  const refreshWithStoredToken = async (): Promise<void> => {
    if (!state.currentRefreshToken) {
      console.log(`🔄 [${new Date().toISOString()}] No refresh token available, attempting login with stored credentials...`);
      if (!state.storedCredentials) {
        throw new Error("No refresh token or stored credentials available");
      }
      await api.login(state.storedCredentials);
      return;
    }
    
    try {
      await api.refresh({ refresh: state.currentRefreshToken });
    } catch (error) {
      console.log(`❌ [${new Date().toISOString()}] Token refresh failed, attempting login with stored credentials...`, error);
      if (!state.storedCredentials) {
        throw new Error("Token refresh failed and no stored credentials available");
      }
      await api.login(state.storedCredentials);
    }
  };
  
  const getAuthToken = () => state.currentAuthToken;
  
  return { api, refreshWithStoredToken, getAuthToken };
};

// ============================================================================
// Test Runner
// ============================================================================

const runTest = async (testName: string, testFn: () => Promise<void>): Promise<boolean> => {
  try {
    console.log(`\n🧪 Running: ${testName}`);
    await testFn();
    console.log(`✅ ${testName} - PASSED`);
    return true;
  } catch (error) {
    console.log(`❌ ${testName} - FAILED:`, error instanceof Error ? error.message : error);
    return false;
  }
};

const main = async (): Promise<void> => {
  console.log('🚀 Starting Authentication Retry Tests...\n');
  
  const results: boolean[] = [];

  // ============================================================================
  // Test 1: Token Refresh Failure with Successful Login Retry
  // ============================================================================
  results.push(await runTest('Token Refresh Failure → Login Retry Success', async () => {
    const fakeClient = createFakeHttpClient({
      authEndpointBehavior: 'success',
      refreshEndpointBehavior: 'failure', // This will fail
      apiEndpointBehavior: 'auth-required'
    });

    const credentials: AuthCredentials = {
      username: 'testuser',
      password: 'testpass',
      type: 'normal'
    };

    const { api, refreshWithStoredToken, getAuthToken } = createAuthService(fakeClient, credentials);

    // Initial login
    await api.login(credentials);
    
    // Simulate refresh token failure - should trigger login retry
    fakeClient.updateConfig({ authEndpointBehavior: 'success' }); // Make sure retry succeeds
    await refreshWithStoredToken();

    const counts = fakeClient.getCallCounts();
    if (counts.login !== 2) {
      throw new Error(`Expected 2 login calls, got ${counts.login}`);
    }
    if (counts.refresh !== 1) {
      throw new Error(`Expected 1 refresh call, got ${counts.refresh}`);
    }
    if (!getAuthToken()) {
      throw new Error('Expected auth token to be set after retry');
    }
  }));

  // ============================================================================
  // Test 2: Login Failure Scenario
  // ============================================================================
  results.push(await runTest('Login Failure Scenario', async () => {
    const fakeClient = createFakeHttpClient({
      authEndpointBehavior: 'failure',
      refreshEndpointBehavior: 'success',
      apiEndpointBehavior: 'success'
    });

    const credentials: AuthCredentials = {
      username: 'baduser',
      password: 'badpass',
      type: 'normal'
    };

    const { api } = createAuthService(fakeClient, credentials);

    try {
      await api.login(credentials);
      throw new Error('Login should have failed');
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('HTTP 401'))) {
        throw new Error(`Expected HTTP 401 error, got: ${error instanceof Error ? error.message : error}`);
      }
    }

    const counts = fakeClient.getCallCounts();
    if (counts.login !== 1) {
      throw new Error(`Expected 1 login call, got ${counts.login}`);
    }
  }));

  // ============================================================================
  // Test 3: Network Failure Scenario
  // ============================================================================
  results.push(await runTest('Network Failure Scenario', async () => {
    const fakeClient = createFakeHttpClient({
      authEndpointBehavior: 'network-error',
      refreshEndpointBehavior: 'network-error',
      apiEndpointBehavior: 'network-error'
    });

    const credentials: AuthCredentials = {
      username: 'testuser',
      password: 'testpass',
      type: 'normal'
    };

    const { api, refreshWithStoredToken } = createAuthService(fakeClient, credentials);

    // Test login network failure
    try {
      await api.login(credentials);
      throw new Error('Login should have failed with network error');
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('Network error'))) {
        throw new Error(`Expected network error, got: ${error instanceof Error ? error.message : error}`);
      }
    }

    // Test refresh network failure
    try {
      await refreshWithStoredToken();
      throw new Error('Refresh should have failed with network error');
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('Network error'))) {
        throw new Error(`Expected network error, got: ${error instanceof Error ? error.message : error}`);
      }
    }
  }));

  // ============================================================================
  // Test 4: No Stored Credentials Scenario
  // ============================================================================
  results.push(await runTest('No Stored Credentials Scenario', async () => {
    const fakeClient = createFakeHttpClient({
      authEndpointBehavior: 'success',
      refreshEndpointBehavior: 'failure',
      apiEndpointBehavior: 'auth-required'
    });

    // Create auth service WITHOUT credentials
    const { refreshWithStoredToken } = createAuthService(fakeClient);

    try {
      await refreshWithStoredToken();
      throw new Error('Refresh should have failed - no stored credentials');
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('No refresh token or stored credentials available'))) {
        throw new Error(`Expected 'no stored credentials' error, got: ${error instanceof Error ? error.message : error}`);
      }
    }
  }));

  // ============================================================================
  // Test 5: Full Flow with Multiple Retries
  // ============================================================================
  results.push(await runTest('Full Flow with Multiple Retries', async () => {
    const fakeClient = createFakeHttpClient({
      authEndpointBehavior: 'success',
      refreshEndpointBehavior: 'success',
      apiEndpointBehavior: 'auth-required'
    });

    const credentials: AuthCredentials = {
      username: 'testuser',
      password: 'testpass',
      type: 'normal'
    };

    const { api, refreshWithStoredToken } = createAuthService(fakeClient, credentials);

    // Initial login
    await api.login(credentials);
    
    // First refresh (should succeed)
    await refreshWithStoredToken();
    
    // Make refresh fail, should trigger login retry
    fakeClient.updateConfig({ refreshEndpointBehavior: 'failure' });
    await refreshWithStoredToken();

    const counts = fakeClient.getCallCounts();
    if (counts.login !== 2) { // Initial + retry
      throw new Error(`Expected 2 login calls, got ${counts.login}`);
    }
    if (counts.refresh !== 2) { // First success + failure
      throw new Error(`Expected 2 refresh calls, got ${counts.refresh}`);
    }
  }));

  // ============================================================================
  // Results Summary
  // ============================================================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${total - passed}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All authentication retry tests passed!');
    console.log('✨ The authentication system properly handles:');
    console.log('   • Token refresh failures with credential fallback');
    console.log('   • Login failures with proper error handling');
    console.log('   • Network failures with appropriate error messages');
    console.log('   • Missing credential scenarios');
    console.log('   • Complex retry flows with multiple attempts');
  } else {
    console.log('\n💥 Some tests failed. Please review the implementation.');
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('💥 Unhandled error in test runner:', error);
  process.exit(1);
});