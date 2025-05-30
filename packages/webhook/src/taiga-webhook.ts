// @vibe-generated: taiga webhook processing logic
import { Schema } from "effect";
import { UserStoryCreateWebhookMessage } from "@taiga-task-master/taiga-api-interface";

export interface TaigaWebhookConfig {
  webhookToken: string;
}

export interface TaigaWebhookRequest {
  headers: {
    "x-taiga-webhook-signature"?: string;
  };
  body: unknown;
}

export type TaigaWebhookProcessor<T> = (
  message: UserStoryCreateWebhookMessage
) => Promise<T>;

/**
 * Creates Taiga webhook config from environment variables
 */
export function createTaigaWebhookConfig(): TaigaWebhookConfig {
  const webhookToken = process.env.WEBHOOK_TOKEN;
  if (!webhookToken) {
    throw new Error("WEBHOOK_TOKEN environment variable is required");
  }
  return { webhookToken };
}

/**
 * Processes Taiga webhook for user story creation with "prd" tag
 * This is a curried function that takes config first, then processor, then request
 */
export function processTaigaWebhook<T>(config: TaigaWebhookConfig) {
  return (processor: TaigaWebhookProcessor<T>) =>
    async (
      request: TaigaWebhookRequest
    ): Promise<{ success: boolean; result?: T; error?: string }> => {
      // Extract signature from headers
      const signature = request.headers["x-taiga-webhook-signature"];
      if (!signature) {
        return { success: false, error: "Missing webhook signature" };
      }

      // Convert body to JSON string for signature verification
      const dataString = JSON.stringify(request.body);

      // Verify signature (imported from taiga-api package)
      const { verifySignature } = await import("@taiga-task-master/taiga-api");
      if (!verifySignature(config.webhookToken, dataString, signature)) {
        return { success: false, error: "Invalid webhook signature" };
      }

      // First check if it's a webhook message with an action field
      const bodyWithAction = request.body as { action?: string };

      // Filter for create actions only
      if (bodyWithAction.action !== "create") {
        return { success: false, error: "Only 'create' actions are supported" };
      }

      // Parse as complete create message
      const parseResult = Schema.decodeUnknownEither(
        UserStoryCreateWebhookMessage
      )(request.body);
      if (parseResult._tag === "Left") {
        return { success: false, error: "Invalid webhook message format" };
      }

      const webhookMessage = parseResult.right;

      // Filter for user stories with "prd" tag
      const hasPrdTag = webhookMessage.data.tags.includes("prd");
      if (!hasPrdTag) {
        return { success: false, error: "User story must have 'prd' tag" };
      }

      try {
        const result = await processor(webhookMessage);
        return { success: true, result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Processing failed",
        };
      }
    };
}
