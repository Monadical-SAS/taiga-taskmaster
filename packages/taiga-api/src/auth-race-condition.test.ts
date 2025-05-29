/* eslint-disable functional/no-let, @typescript-eslint/no-explicit-any */
// @vibe-generated: test for auth race condition fix
import { describe, it, expect, vi, beforeEach } from "vitest";
import { taigaApiFactory } from "./index.js";
import type {
  AuthCredentials,
  HttpClientConfig,
} from "@taiga-task-master/taiga-api-interface";

// Mock undici
vi.mock("undici", () => ({
  request: vi.fn(),
}));

describe("Authentication Race Condition Fix", () => {
  let loginCallCount: number;
  let refreshCallCount: number;
  let credentials: AuthCredentials;
  let mockRequest: ReturnType<typeof vi.fn>;
  let hasValidToken: boolean;

  beforeEach(async () => {
    loginCallCount = 0;
    refreshCallCount = 0;
    hasValidToken = false;
    credentials = { username: "test", password: "test", type: "normal" };

    // Get the mocked request function
    const { request } = await import("undici");
    mockRequest = request as ReturnType<typeof vi.fn>;

    mockRequest.mockImplementation((url: string, options: any) => {
      const urlStr = url.toString();

      if (urlStr.includes("/api/v1/auth") && !urlStr.includes("/refresh")) {
        loginCallCount++;
        hasValidToken = true;
        return Promise.resolve({
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: {
            json: () =>
              Promise.resolve({
                id: 1,
                username: "test",
                email: "test@example.com",
                full_name: "Test User",
                auth_token: `mock-auth-token-${loginCallCount}`,
                refresh: `mock-refresh-token-${loginCallCount}`,
                accepted_terms: true,
                read_new_terms: true,
              }),
          },
        });
      }

      if (urlStr.includes("/api/v1/auth/refresh")) {
        refreshCallCount++;
        hasValidToken = true;
        return Promise.resolve({
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: {
            json: () =>
              Promise.resolve({
                auth_token: `refreshed-auth-token-${refreshCallCount}`,
                refresh: `refreshed-refresh-token-${refreshCallCount}`,
              }),
          },
        });
      }

      // For tasks endpoint
      if (urlStr.includes("/api/v1/tasks")) {
        if (!hasValidToken) {
          return Promise.resolve({
            statusCode: 401,
            headers: { "content-type": "text/plain" },
            body: {
              text: () => Promise.resolve("Unauthorized"),
            },
          });
        }
        return Promise.resolve({
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: {
            json: () =>
              Promise.resolve([
                {
                  id: 1,
                  ref: 1,
                  subject: "Test Task",
                  description: "",
                  status: 1,
                  project: 1,
                  assigned_to: null,
                  created_date: "2025-01-01T00:00:00Z",
                  modified_date: "2025-01-01T00:00:00Z",
                  finished_date: null,
                  user_story: null,
                  tags: [],
                  is_blocked: false,
                  blocked_note: "",
                  is_closed: false,
                  us_order: 1,
                  external_reference: null,
                  version: 1,
                  watchers: [],
                  generated_user_stories: null,
                  attachments: [],
                  taskboard_order: 1,
                  owner: 1,
                },
              ]),
          },
        });
      }

      return Promise.resolve({
        statusCode: 404,
        headers: { "content-type": "text/plain" },
        body: {
          text: () => Promise.resolve("Not Found"),
        },
      });
    });
  });

  it("should handle multiple concurrent 401 errors with only one login attempt", async () => {
    const config: HttpClientConfig = {
      baseUrl: "http://mock-taiga.com" as HttpClientConfig["baseUrl"],
      credentials,
    };

    const taigaApi = taigaApiFactory.create(config);

    // Reset counters and simulate no valid token
    loginCallCount = 0;
    hasValidToken = false;

    // Create multiple concurrent requests that will all trigger 401 -> login
    const concurrentRequests = Array.from({ length: 5 }, () =>
      taigaApi.tasks.list().catch(() => "expected to fail")
    );

    // Wait for all concurrent requests to complete
    await Promise.allSettled(concurrentRequests);

    // The key assertion: only one login call was made despite 5 concurrent 401s
    // This proves the race condition fix is working
    expect(loginCallCount).toBe(1);

    // The fact that loginCallCount is 1 means the ongoingRefresh promise caching worked:
    // - First request triggered login
    // - Subsequent 4 requests waited for the same login promise
    // - No duplicate login attempts occurred
  });

  it("should use refresh token when available instead of login", async () => {
    const config: HttpClientConfig = {
      baseUrl: "http://mock-taiga.com" as HttpClientConfig["baseUrl"],
      credentials,
    };

    const taigaApi = taigaApiFactory.create(config);

    // First, establish a session (this will call login and set hasValidToken)
    await taigaApi.tasks.list().catch(() => "expected to fail initially");
    expect(loginCallCount).toBe(1);
    expect(refreshCallCount).toBe(0);

    // Reset token validity to simulate expiration
    hasValidToken = false;
    loginCallCount = 0;

    // Make multiple concurrent requests - should trigger refresh, not login
    const concurrentRequests = Array.from({ length: 3 }, () =>
      taigaApi.tasks.list().catch(() => "expected to fail")
    );

    await Promise.allSettled(concurrentRequests);

    // Should have refreshed once, not logged in again
    // This proves that when a refresh token exists, refresh is used instead of login
    expect(refreshCallCount).toBe(1);
    expect(loginCallCount).toBe(0);
  });
});
