// @vibe-generated: tests for updated webhook handler
import { describe, it, expect, vi } from "vitest";
import { webhookHandler, parseRequest } from "./index.js";
import type {
  WebhookDeps,
  WebhookRequest,
  WebhookAuthToken,
  WebhookConfig,
} from "@taiga-task-master/webhook-interface";
import { IncomingMessage } from "node:http";
import { Readable } from "node:stream";
import * as crypto from "node:crypto";

// Helper function to generate HMAC-SHA1 signature for test payloads
function generateSignature(body: string, token: string): string {
  const mac = crypto.createHmac("sha1", token);
  mac.update(body, "utf8");
  return mac.digest("hex");
}

describe("webhook implementation", () => {
  const createMockDeps = () => {
    const mockGenerateTasks = vi.fn().mockResolvedValue(2); // Return number directly

    const mockDeps: WebhookDeps = {
      config: {
        WEBHOOK_TOKEN: "test-token" as WebhookAuthToken,
        PORT: 3000 as WebhookConfig["PORT"],
      },
      generateTasks: mockGenerateTasks,
    };

    return { mockDeps, mockGenerateTasks };
  };

  describe("webhookHandler", () => {
    it("should process valid Taiga webhook with minimal payload", async () => {
      const { mockDeps, mockGenerateTasks } = createMockDeps();

      const requestBody = {
        action: "create" as const,
        data: {
          description: "This is a sample PRD content for task generation",
          project: {
            id: 12345,
          },
        },
      };

      const bodyString = JSON.stringify(requestBody);
      const validSignature = generateSignature(bodyString, "test-token");

      const request: WebhookRequest = {
        headers: { "x-taiga-webhook-signature": validSignature },
        body: requestBody,
        rawBody: bodyString,
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Successfully processed Taiga webhook for user story",
        tasks_generated: 2,
      });

      expect(mockGenerateTasks).toHaveBeenCalledWith(
        "This is a sample PRD content for task generation"
      );
    });

    it("should reject invalid webhook signature", async () => {
      const { mockDeps } = createMockDeps();

      const requestBody = {
        action: "create" as const,
        data: {
          description: "Test description",
          project: {
            id: 12345,
          },
        },
      };

      const request: WebhookRequest = {
        headers: { "x-taiga-webhook-signature": "invalid-signature" },
        body: requestBody,
        rawBody: JSON.stringify(requestBody),
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized",
      });
    });

    it("should handle change action webhooks", async () => {
      const { mockDeps, mockGenerateTasks } = createMockDeps();

      // Override the mock to return 0 for this test
      mockGenerateTasks.mockResolvedValueOnce(0);

      const requestBody = {
        action: "change" as const,
        data: {
          description: "Updated PRD content with changes",
          project: {
            id: 67890,
          },
        },
      };

      const bodyString = JSON.stringify(requestBody);
      const validSignature = generateSignature(bodyString, "test-token");

      const request: WebhookRequest = {
        headers: { "x-taiga-webhook-signature": validSignature },
        body: requestBody,
        rawBody: bodyString,
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Successfully processed Taiga webhook for user story",
        tasks_generated: 0,
      });
    });

    it("should handle errors in task generation", async () => {
      const { mockDeps, mockGenerateTasks } = createMockDeps();

      mockGenerateTasks.mockRejectedValueOnce(
        new Error("Task generation failed")
      );

      const requestBody = {
        action: "create" as const,
        data: {
          description: "Test description",
          project: {
            id: 12345,
          },
        },
      };

      const bodyString = JSON.stringify(requestBody);
      const validSignature = generateSignature(bodyString, "test-token");

      const request: WebhookRequest = {
        headers: { "x-taiga-webhook-signature": validSignature },
        body: requestBody,
        rawBody: bodyString,
      };

      const handler = webhookHandler(mockDeps);
      const response = await handler(request);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Task generation failed",
      });
    });
  });

  describe("parseRequest", () => {
    it("should parse valid request with simplified payload", async () => {
      const mockPayload = {
        action: "create",
        data: {
          description: "Test PRD content",
          project: {
            id: 12345,
          },
        },
      };

      const mockReq = new Readable({
        read() {
          this.push(JSON.stringify(mockPayload));
          this.push(null);
        },
      }) as IncomingMessage;

      mockReq.headers = {
        "x-taiga-webhook-signature": "test-signature",
      };

      const result = await parseRequest(mockReq);

      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right.headers["x-taiga-webhook-signature"]).toBe(
          "test-signature"
        );
        expect(result.right.body.action).toBe("create");
        expect(result.right.body.data.description).toBe("Test PRD content");
        expect(result.right.body.data.project.id).toBe(12345);
        expect(result.right.rawBody).toBe(JSON.stringify(mockPayload));
      }
    });

    it("should handle invalid JSON", async () => {
      const mockReq = new Readable({
        read() {
          this.push("invalid json");
          this.push(null);
        },
      }) as IncomingMessage;

      mockReq.headers = {
        "x-taiga-webhook-signature": "test-signature",
      };

      await expect(parseRequest(mockReq)).rejects.toThrow(
        "Invalid JSON payload"
      );
    });

    it("should handle missing signature header", async () => {
      const mockPayload = {
        action: "create",
        data: {
          description: "Test",
          project: {
            id: 123,
          },
        },
      };

      const mockReq = new Readable({
        read() {
          this.push(JSON.stringify(mockPayload));
          this.push(null);
        },
      }) as IncomingMessage;

      mockReq.headers = {}; // No signature header

      const result = await parseRequest(mockReq);

      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right.headers["x-taiga-webhook-signature"]).toBe("");
        expect(result.right.rawBody).toBe(JSON.stringify(mockPayload));
      }
    });
  });
});
