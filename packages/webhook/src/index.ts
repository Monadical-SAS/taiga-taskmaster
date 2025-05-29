// @vibe-generated: conforms to webhook-interface
/* eslint-disable functional/no-loop-statements, functional/immutable-data, functional/no-let, functional/no-expression-statements, @typescript-eslint/no-unused-vars */
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { Schema, Option } from "effect";

// Import all types and functions from webhook-interface
export * from "@taiga-task-master/webhook-interface";
import type {
  WebhookDeps,
  WebhookHandler,
  WebhookRequest,
  WebhookResponse,
} from "@taiga-task-master/webhook-interface";
import {
  WebhookPayload,
  validateAuthHeader,
  assertEnvironment,
} from "@taiga-task-master/webhook-interface";

/**
 * Parses incoming HTTP request into WebhookRequest format
 */
export const parseRequest = async (
  req: IncomingMessage
): Promise<WebhookRequest> => {
  // Collect request body
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const bodyText = Buffer.concat(chunks).toString("utf-8");

  // Parse JSON body
  let bodyJson;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch (error) {
    throw new Error("Invalid JSON payload");
  }

  // Validate payload schema
  const payload = Schema.decodeUnknownSync(WebhookPayload)(bodyJson);

  return {
    headers: {
      authorization: req.headers.authorization || "",
    },
    body: payload,
  };
};

/**
 * Sends HTTP response based on WebhookResponse
 */
export const sendResponse = (
  res: ServerResponse,
  response: WebhookResponse
): void => {
  res.statusCode = response.status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(response.body));
};

/**
 * Main webhook handler implementation
 */
export const webhookHandler: WebhookHandler = (deps) => async (request) => {
  try {
    // Validate authorization
    if (
      !validateAuthHeader(
        request.headers.authorization,
        deps.config.WEBHOOK_TOKEN
      )
    ) {
      return {
        status: 401,
        body: {
          error: "Unauthorized",
        },
      };
    }

    // Process PRD update
    // First generate tasks to get count, then sync happens automatically
    const tasksContent = await deps.taskGeneratorDeps.taskmaster.generateTasks(
      request.body.prd,
      Option.none()
    );

    // Sync to Taiga (this is the full orchestration)
    await deps.generateTasks(deps.taskGeneratorDeps)(request.body.prd);

    // Count tasks in the generated content
    const tasksCount = Array.isArray(tasksContent.tasks)
      ? tasksContent.tasks.length
      : 0;

    return {
      status: 200,
      body: {
        message: `Successfully processed PRD update${request.body.project_id ? ` for project ${request.body.project_id}` : ""}`,
        tasks_generated: tasksCount,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Return 400 for validation errors, 500 for unexpected errors
    const isValidationError =
      errorMessage.includes("Invalid") ||
      errorMessage.includes("Expected") ||
      errorMessage.includes("decode");

    return {
      status: isValidationError ? 400 : 500,
      body: {
        error: errorMessage,
      },
    };
  }
};

/**
 * Creates and starts HTTP server
 */
export const createWebhookServer = (deps: WebhookDeps) => {
  const handler = webhookHandler(deps);

  const server = createServer(async (req, res) => {
    try {
      // Only handle POST requests to /api/prd-webhook
      if (req.method !== "POST" || req.url !== "/api/prd-webhook") {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Not Found" }));
        return;
      }

      const request = await parseRequest(req);
      const response = await handler(request);
      sendResponse(res, response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const response: WebhookResponse = {
        status: 400,
        body: {
          error: errorMessage,
        },
      };
      sendResponse(res, response);
    }
  });

  return {
    start: () => {
      return new Promise<void>((resolve) => {
        server.listen(deps.config.PORT, () => {
          console.log(`Webhook server listening on port ${deps.config.PORT}`);
          resolve();
        });
      });
    },
    stop: () => {
      return new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    },
  };
};

/**
 * Main entry point - validates environment and starts server
 */
export const startWebhookServer = async (deps: Omit<WebhookDeps, "config">) => {
  // Validate environment at startup
  const config = assertEnvironment(process.env);

  const fullDeps: WebhookDeps = {
    ...deps,
    config,
  };

  const server = createWebhookServer(fullDeps);
  await server.start();

  return server;
};
