/* eslint-disable functional/no-let, @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { webhookHandler, parseRequest, sendResponse } from "./index.js";
import type {
  WebhookDeps,
  WebhookRequest,
  WebhookResponse,
  WebhookConfig,
} from "@taiga-task-master/webhook-interface";
// Simplified mock type for testing - avoids complex branded types
type MockTasksFileContent = {
  tasks?: Array<{ id: number | string; [key: string]: unknown }>;
  [key: string]: unknown;
};
import { assertEnvironment } from "@taiga-task-master/webhook-interface";
import type { IncomingMessage, ServerResponse } from "node:http";

describe("webhook implementation", () => {
  const mockConfig: WebhookConfig = {
    WEBHOOK_TOKEN: "test-token" as any,
    PORT: 3000 as any,
  };

  describe("webhookHandler", () => {
    let mockDeps: WebhookDeps;
    let mockGenerateTasks: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockGenerateTasks = vi.fn();
      mockDeps = {
        config: mockConfig,
        generateTasks: vi.fn(() => mockGenerateTasks),
        taskGeneratorDeps: {} as any,
      };
    });

    it("processes valid request successfully", async () => {
      const mockTasksContent: MockTasksFileContent = {
        tasks: [
          { id: 1, title: "Task 1" },
          { id: 2, title: "Task 2" },
          { id: 3, title: "Task 3" },
        ],
      };
      mockGenerateTasks.mockResolvedValue(mockTasksContent);

      const request: WebhookRequest = {
        headers: { authorization: "Bearer test-token" },
        body: {
          type: "prd_update",
          prd: "Sample PRD content" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Successfully processed PRD update for project project-123",
        tasks_generated: 3,
      });
      expect(mockGenerateTasks).toHaveBeenCalledWith("Sample PRD content");
    });

    it("processes valid request successfully without project_id", async () => {
      const mockTasksContent: MockTasksFileContent = {
        tasks: [
          { id: 1, title: "Task 1" },
          { id: 2, title: "Task 2" },
        ],
      };
      mockGenerateTasks.mockResolvedValue(mockTasksContent);

      const request: WebhookRequest = {
        headers: { authorization: "Bearer test-token" },
        body: {
          type: "prd_update",
          prd: "Sample PRD content" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Successfully processed PRD update",
        tasks_generated: 2,
      });
      expect(mockGenerateTasks).toHaveBeenCalledWith("Sample PRD content");
    });

    it("handles unauthorized request with invalid token", async () => {
      const request: WebhookRequest = {
        headers: { authorization: "Bearer wrong-token" },
        body: {
          type: "prd_update",
          prd: "Sample PRD content" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized",
      });
      expect(mockGenerateTasks).not.toHaveBeenCalled();
    });

    it("handles unauthorized request with missing Bearer prefix", async () => {
      const request: WebhookRequest = {
        headers: { authorization: "test-token" },
        body: {
          type: "prd_update",
          prd: "Sample PRD content" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized",
      });
    });

    it("handles empty authorization header", async () => {
      const request: WebhookRequest = {
        headers: { authorization: "" },
        body: {
          type: "prd_update",
          prd: "Sample PRD content" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized",
      });
    });

    it("handles task generation failure as 500 error", async () => {
      mockGenerateTasks.mockRejectedValue(
        new Error("Task generation service unavailable")
      );

      const request: WebhookRequest = {
        headers: { authorization: "Bearer test-token" },
        body: {
          type: "prd_update",
          prd: "Sample PRD content" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Task generation service unavailable",
      });
    });

    it("handles validation errors as 400 error", async () => {
      mockGenerateTasks.mockRejectedValue(
        new Error("Invalid PRD format: Expected string")
      );

      const request: WebhookRequest = {
        headers: { authorization: "Bearer test-token" },
        body: {
          type: "prd_update",
          prd: "Sample PRD content" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Invalid PRD format: Expected string",
      });
    });

    it("handles decode errors as 400 error", async () => {
      mockGenerateTasks.mockRejectedValue(
        new Error("decode failed for schema")
      );

      const request: WebhookRequest = {
        headers: { authorization: "Bearer test-token" },
        body: {
          type: "prd_update",
          prd: "Sample PRD content" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "decode failed for schema",
      });
    });

    it("counts tasks correctly when no tasks are generated", async () => {
      const mockTasksContent: MockTasksFileContent = { tasks: [] };
      mockGenerateTasks.mockResolvedValue(mockTasksContent);

      const request: WebhookRequest = {
        headers: { authorization: "Bearer test-token" },
        body: {
          type: "prd_update",
          prd: "Empty PRD" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Successfully processed PRD update for project project-123",
        tasks_generated: 0,
      });
    });

    it("handles tasks content without tasks array", async () => {
      const mockTasksContent: MockTasksFileContent = { metadata: "some data" };
      mockGenerateTasks.mockResolvedValue(mockTasksContent);

      const request: WebhookRequest = {
        headers: { authorization: "Bearer test-token" },
        body: {
          type: "prd_update",
          prd: "PRD without tasks" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Successfully processed PRD update for project project-123",
        tasks_generated: 0,
      });
    });

    it("handles non-Error exceptions", async () => {
      mockGenerateTasks.mockRejectedValue("String error");

      const request: WebhookRequest = {
        headers: { authorization: "Bearer test-token" },
        body: {
          type: "prd_update",
          prd: "Sample PRD content" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Unknown error",
      });
    });

    it("handles large number of tasks correctly", async () => {
      const mockTasksContent: MockTasksFileContent = {
        tasks: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          title: `Task ${i + 1}`,
        })),
      };
      mockGenerateTasks.mockResolvedValue(mockTasksContent);

      const request: WebhookRequest = {
        headers: { authorization: "Bearer test-token" },
        body: {
          type: "prd_update",
          prd: "Large PRD content" as any,
          project_id: "project-123" as any,
        },
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Successfully processed PRD update for project project-123",
        tasks_generated: 100,
      });
    });
  });

  describe("parseRequest", () => {
    it("parses valid request successfully", async () => {
      const mockReq = {
        headers: { authorization: "Bearer test-token" },
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(
            JSON.stringify({
              type: "prd_update",
              prd: "Sample PRD content",
              project_id: "project-123",
            })
          );
        },
      } as any as IncomingMessage;

      const result = await parseRequest(mockReq);

      expect(result).toEqual({
        headers: { authorization: "Bearer test-token" },
        body: {
          type: "prd_update",
          prd: "Sample PRD content",
          project_id: "project-123",
        },
      });
    });

    it("handles missing authorization header", async () => {
      const mockReq = {
        headers: {},
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(
            JSON.stringify({
              type: "prd_update",
              prd: "Sample PRD content",
              project_id: "project-123",
            })
          );
        },
      } as any as IncomingMessage;

      const result = await parseRequest(mockReq);

      expect(result.headers.authorization).toBe("");
    });

    it("throws error for invalid JSON", async () => {
      const mockReq = {
        headers: { authorization: "Bearer test-token" },
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from("{ invalid json");
        },
      } as any as IncomingMessage;

      await expect(parseRequest(mockReq)).rejects.toThrow(
        "Invalid JSON payload"
      );
    });

    it("throws error for invalid payload schema", async () => {
      const mockReq = {
        headers: { authorization: "Bearer test-token" },
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(
            JSON.stringify({
              type: "invalid_type",
              prd: "Sample PRD content",
              project_id: "project-123",
            })
          );
        },
      } as any as IncomingMessage;

      await expect(parseRequest(mockReq)).rejects.toThrow();
    });

    it("throws error for empty PRD", async () => {
      const mockReq = {
        headers: { authorization: "Bearer test-token" },
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(
            JSON.stringify({
              type: "prd_update",
              prd: "",
              project_id: "project-123",
            })
          );
        },
      } as any as IncomingMessage;

      await expect(parseRequest(mockReq)).rejects.toThrow();
    });

    it("handles large request body", async () => {
      const largePrd = "A".repeat(10000);
      const mockReq = {
        headers: { authorization: "Bearer test-token" },
        [Symbol.asyncIterator]: async function* () {
          // Split into multiple chunks to simulate streaming
          const payload = JSON.stringify({
            type: "prd_update",
            prd: largePrd,
            project_id: "project-123",
          });
          const chunkSize = 1000;
          for (let i = 0; i < payload.length; i += chunkSize) {
            yield Buffer.from(payload.slice(i, i + chunkSize));
          }
        },
      } as any as IncomingMessage;

      const result = await parseRequest(mockReq);

      expect(result.body.prd).toBe(largePrd);
      expect(result.body.type).toBe("prd_update");
    });
  });

  describe("sendResponse", () => {
    let mockRes: Partial<ServerResponse>;

    beforeEach(() => {
      mockRes = {
        statusCode: 0,
        setHeader: vi.fn(),
        end: vi.fn(),
      };
    });

    it("sends 200 success response correctly", () => {
      const response: WebhookResponse = {
        status: 200,
        body: {
          message: "Success",
          tasks_generated: 5,
        },
      };

      sendResponse(mockRes as ServerResponse, response);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/json"
      );
      expect(mockRes.end).toHaveBeenCalledWith(
        JSON.stringify({ message: "Success", tasks_generated: 5 })
      );
    });

    it("sends 401 unauthorized response correctly", () => {
      const response: WebhookResponse = {
        status: 401,
        body: {
          error: "Unauthorized",
        },
      };

      sendResponse(mockRes as ServerResponse, response);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/json"
      );
      expect(mockRes.end).toHaveBeenCalledWith(
        JSON.stringify({ error: "Unauthorized" })
      );
    });

    it("sends 400 bad request response correctly", () => {
      const response: WebhookResponse = {
        status: 400,
        body: {
          error: "Invalid payload format",
        },
      };

      sendResponse(mockRes as ServerResponse, response);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/json"
      );
      expect(mockRes.end).toHaveBeenCalledWith(
        JSON.stringify({ error: "Invalid payload format" })
      );
    });

    it("sends 500 internal server error response correctly", () => {
      const response: WebhookResponse = {
        status: 500,
        body: {
          error: "Internal server error",
        },
      };

      sendResponse(mockRes as ServerResponse, response);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/json"
      );
      expect(mockRes.end).toHaveBeenCalledWith(
        JSON.stringify({ error: "Internal server error" })
      );
    });
  });

  describe("assertEnvironment", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("validates correct environment variables", () => {
      const env = {
        WEBHOOK_TOKEN: "test-secret-token",
        PORT: "8080",
      };

      const result = assertEnvironment(env);

      expect(result.WEBHOOK_TOKEN).toBe("test-secret-token");
      expect(result.PORT).toBe(8080);
    });

    it("uses default port when PORT is not specified", () => {
      const env = {
        WEBHOOK_TOKEN: "test-secret-token",
      };

      const result = assertEnvironment(env);

      expect(result.WEBHOOK_TOKEN).toBe("test-secret-token");
      expect(result.PORT).toBe(3000);
    });

    it("throws error when WEBHOOK_TOKEN is missing", () => {
      const env = {
        PORT: "8080",
      };

      expect(() => assertEnvironment(env)).toThrow(
        "WEBHOOK_TOKEN environment variable is required"
      );
    });

    it("throws error when WEBHOOK_TOKEN is empty string", () => {
      const env = {
        WEBHOOK_TOKEN: "",
        PORT: "8080",
      };

      expect(() => assertEnvironment(env)).toThrow(
        "WEBHOOK_TOKEN environment variable is required"
      );
    });

    it("throws error when WEBHOOK_TOKEN is undefined", () => {
      const env = {
        WEBHOOK_TOKEN: undefined,
        PORT: "8080",
      };

      expect(() => assertEnvironment(env)).toThrow(
        "WEBHOOK_TOKEN environment variable is required"
      );
    });

    it("parses PORT correctly when provided as string", () => {
      const env = {
        WEBHOOK_TOKEN: "test-token",
        PORT: "5000",
      };

      const result = assertEnvironment(env);

      expect(result.PORT).toBe(5000);
    });

    it("throws error for invalid PORT schema validation", () => {
      const env = {
        WEBHOOK_TOKEN: "test-token",
        PORT: "-1", // negative port should fail schema validation
      };

      expect(() => assertEnvironment(env)).toThrow();
    });

    it("handles non-integer PORT by truncating to integer", () => {
      const env = {
        WEBHOOK_TOKEN: "test-token",
        PORT: "3000.5", // parseInt will truncate to 3000
      };

      const result = assertEnvironment(env);
      expect(result.PORT).toBe(3000);
    });
  });
});
