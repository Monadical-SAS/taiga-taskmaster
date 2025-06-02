// @vibe-generated: taiga webhook processing logic
import { Schema } from "effect";
import {
  UserStoryWebhookMessage,
  UserStoryCreateWebhookMessage,
} from "@taiga-task-master/taiga-api-interface";
import { TreeFormatter } from "effect/ParseResult";
import { isLeft } from "effect/Either";

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

      const dataString = JSON.stringify(request.body);

      const { verifySignature } = await import("@taiga-task-master/taiga-api");
      if (!verifySignature(config.webhookToken, dataString, signature)) {
        return { success: false, error: "Invalid webhook signature" };
      }

      // Parse as general webhook message first
      const parseResult = Schema.decodeUnknownEither(UserStoryWebhookMessage)(
        request.body
      );
      if (isLeft(parseResult)) {
        return {
          success: false,
          error: `Invalid webhook message format: ${TreeFormatter.formatError(parseResult.left)}`,
        };
      }

      const webhookMessage = parseResult.right;

      // Check for create action at business logic level
      if (webhookMessage.action !== "create") {
        return { success: false, error: "Only 'create' actions are supported" };
      }

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
