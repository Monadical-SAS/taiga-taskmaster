import { Schema } from "effect";
import { NonEmptyString, PrdText } from "@taiga-task-master/common";
import { type GenerateTasksDeps } from "@taiga-task-master/core";

export const WebhookAuthToken = NonEmptyString.pipe(
  Schema.brand("WebhookAuthToken")
);
export type WebhookAuthToken = typeof WebhookAuthToken.Type;

export const WebhookPayload = Schema.Struct({
  type: Schema.Literal("prd_update"),
  prd: PrdText,
  project_id: Schema.optional(NonEmptyString),
});
export type WebhookPayload = typeof WebhookPayload.Type;

export const WebhookRequest = Schema.Struct({
  headers: Schema.Struct({
    authorization: Schema.String,
  }),
  body: WebhookPayload,
});
export type WebhookRequest = typeof WebhookRequest.Type;

export const WebhookResponse = Schema.Union(
  Schema.Struct({
    status: Schema.Literal(200),
    body: Schema.Struct({
      message: Schema.String,
      tasks_generated: Schema.Number,
    }),
  }),
  Schema.Struct({
    status: Schema.Literal(401),
    body: Schema.Struct({
      error: Schema.Literal("Unauthorized"),
    }),
  }),
  Schema.Struct({
    status: Schema.Literal(400),
    body: Schema.Struct({
      error: Schema.String,
    }),
  }),
  Schema.Struct({
    status: Schema.Literal(500),
    body: Schema.Struct({
      error: Schema.String,
    }),
  })
);
export type WebhookResponse = typeof WebhookResponse.Type;

export const WebhookConfig = Schema.Struct({
  WEBHOOK_TOKEN: WebhookAuthToken,
  PORT: Schema.Number.pipe(Schema.int(), Schema.positive()).pipe(
    Schema.brand("Port")
  ),
});
export type WebhookConfig = typeof WebhookConfig.Type;

export type WebhookDeps = {
  config: WebhookConfig;
  generateTasks: (di: GenerateTasksDeps) => (prd: PrdText) => Promise<void>;
  taskGeneratorDeps: GenerateTasksDeps;
};

export type WebhookHandler = (
  deps: WebhookDeps
) => (request: WebhookRequest) => Promise<WebhookResponse>;

export const validateAuthHeader = (
  authHeader: string,
  expectedToken: WebhookAuthToken
): boolean => {
  const bearerPrefix = "Bearer ";
  if (!authHeader.startsWith(bearerPrefix)) {
    return false;
  }
  const token = authHeader.slice(bearerPrefix.length);
  return token === expectedToken;
};

export const assertEnvironment = (
  env: Record<string, string | undefined>
): WebhookConfig => {
  const port = env.PORT ? parseInt(env.PORT, 10) : 3000;
  const token = env.WEBHOOK_TOKEN;

  if (!token) {
    throw new Error("WEBHOOK_TOKEN environment variable is required");
  }

  const config = {
    WEBHOOK_TOKEN: token,
    PORT: port,
  };

  return Schema.decodeUnknownSync(WebhookConfig)(config);
};
