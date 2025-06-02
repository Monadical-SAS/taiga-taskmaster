// @vibe-generated: tests for taiga webhook handler
import { describe, it, expect } from "vitest";
import * as crypto from "node:crypto";
import {
  createTaigaWebhookConfig,
  processTaigaWebhook,
} from "./taiga-webhook.js";

describe("taiga-webhook", () => {
  const testWebhookToken = "5E5F302C-CDD4-4F25-A33D-55BAB0ABEFE1";
  const config = { webhookToken: testWebhookToken };

  const validWebhookBody = {
    action: "create",
    type: "userstory",
    by: {
      id: 817212,
      permalink: "https://tree.taiga.io/profile/dearlordylord",
      username: "dearlordylord",
      full_name: "Igor Loskutov",
      photo: null,
      gravatar_id: "7416a8945fcf732aceaa2e3496539296",
    },
    date: "2025-05-30T18:11:36.595Z",
    data: {
      custom_attributes_values: {},
      id: 7918000,
      ref: 12,
      project: {
        id: 1693793,
        permalink: "https://tree.taiga.io/project/dearlordylord-tasks",
        name: "Tasks",
        logo_big_url: null,
      },
      is_closed: false,
      created_date: "2025-05-30T18:11:36.541Z",
      modified_date: "2025-05-30T18:11:36.547Z",
      finish_date: null,
      due_date: null,
      due_date_reason: "",
      subject: "Test PRD Story",
      client_requirement: false,
      team_requirement: false,
      generated_from_issue: null,
      generated_from_task: null,
      from_task_ref: null,
      external_reference: null,
      tribe_gig: null,
      watchers: [],
      is_blocked: false,
      blocked_note: "",
      description: "Test description",
      tags: ["prd"], // Has the required "prd" tag
      permalink: "https://tree.taiga.io/project/dearlordylord-tasks/us/12",
      owner: {
        id: 817212,
        permalink: "https://tree.taiga.io/profile/dearlordylord",
        username: "dearlordylord",
        full_name: "Igor Loskutov",
        photo: null,
        gravatar_id: "7416a8945fcf732aceaa2e3496539296",
      },
      assigned_to: null,
      assigned_users: [],
      points: [
        {
          role: "UX",
          name: "?",
          value: null,
        },
      ],
      status: {
        id: 10268077,
        name: "New",
        slug: "new",
        color: "#70728F",
        is_closed: false,
        is_archived: false,
      },
      milestone: null,
    },
  };

  describe("createTaigaWebhookConfig", () => {
    it("should throw error when WEBHOOK_TOKEN is not set", () => {
      const originalToken = process.env.WEBHOOK_TOKEN;
      delete process.env.WEBHOOK_TOKEN;

      expect(() => createTaigaWebhookConfig()).toThrow(
        "WEBHOOK_TOKEN environment variable is required"
      );

      // Restore original value
      if (originalToken) {
        process.env.WEBHOOK_TOKEN = originalToken;
      }
    });

    it("should return config when WEBHOOK_TOKEN is set", () => {
      process.env.WEBHOOK_TOKEN = "test-token";

      const config = createTaigaWebhookConfig();
      expect(config.webhookToken).toBe("test-token");
    });
  });

  describe("processTaigaWebhook", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockProcessor = async (message: any) => {
      return { processedId: message.data.id };
    };

    it("should reject request without signature", async () => {
      const request = {
        headers: {},
        body: validWebhookBody,
      };

      const process = processTaigaWebhook(config)(mockProcessor);
      const result = await process(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing webhook signature");
    });

    it("should reject request with invalid signature", async () => {
      const request = {
        headers: { "x-taiga-webhook-signature": "invalid" },
        body: validWebhookBody,
      };

      const process = processTaigaWebhook(config)(mockProcessor);
      const result = await process(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid webhook signature");
    });

    it("should reject non-create actions", async () => {
      const updateBody = {
        ...validWebhookBody,
        action: "change",
        change: {
          comment: "Test change",
          comment_html: "<p>Test change</p>",
          delete_comment_date: null,
          comment_versions: null,
          edit_comment_date: null,
          diff: {
            description_diff: "Test diff",
          },
        },
      };
      const dataString = JSON.stringify(updateBody);

      // Generate valid signature
      const mac = crypto.createHmac("sha1", testWebhookToken);
      mac.update(dataString, "utf8");
      const signature = mac.digest("hex");

      const request = {
        headers: { "x-taiga-webhook-signature": signature },
        body: updateBody,
      };

      const process = processTaigaWebhook(config)(mockProcessor);
      const result = await process(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Only 'create' actions are supported");
    });

    it("should reject user stories without prd tag", async () => {
      const noPrdBody = {
        ...validWebhookBody,
        data: { ...validWebhookBody.data, tags: ["other-tag"] },
      };
      const dataString = JSON.stringify(noPrdBody);

      // Generate valid signature
      const mac = crypto.createHmac("sha1", testWebhookToken);
      mac.update(dataString, "utf8");
      const signature = mac.digest("hex");

      const request = {
        headers: { "x-taiga-webhook-signature": signature },
        body: noPrdBody,
      };

      const process = processTaigaWebhook(config)(mockProcessor);
      const result = await process(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User story must have 'prd' tag");
    });

    it("should accept valid webhook with prd tag and call processor", async () => {
      const dataString = JSON.stringify(validWebhookBody);

      // Generate valid signature
      const mac = crypto.createHmac("sha1", testWebhookToken);
      mac.update(dataString, "utf8");
      const signature = mac.digest("hex");

      const request = {
        headers: { "x-taiga-webhook-signature": signature },
        body: validWebhookBody,
      };

      const process = processTaigaWebhook(config)(mockProcessor);
      const result = await process(request);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ processedId: 7918000 });
    });

    it("should handle processor errors", async () => {
      const failingProcessor = async () => {
        throw new Error("Processing failed");
      };

      const dataString = JSON.stringify(validWebhookBody);

      // Generate valid signature
      const mac = crypto.createHmac("sha1", testWebhookToken);
      mac.update(dataString, "utf8");
      const signature = mac.digest("hex");

      const request = {
        headers: { "x-taiga-webhook-signature": signature },
        body: validWebhookBody,
      };

      const process = processTaigaWebhook(config)(failingProcessor);
      const result = await process(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Processing failed");
    });
  });
});
