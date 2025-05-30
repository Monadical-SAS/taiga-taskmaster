// @vibe-generated: conforms to webhook-interface
/* eslint-disable functional/no-loop-statements, functional/immutable-data, functional/no-let, functional/no-expression-statements, @typescript-eslint/no-unused-vars */
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { Schema, Option, pipe, Either } from "effect";

// Import all types and functions from webhook-interface
export * from "@taiga-task-master/webhook-interface";

// Export Taiga webhook functionality
export * from "./taiga-webhook.js";
import type {
  WebhookDeps,
  WebhookHandler,
  WebhookRequest,
  WebhookResponse,
} from "@taiga-task-master/webhook-interface";
import {
  WebhookPayload,
  validateWebhookSignature,
  assertEnvironment,
} from "@taiga-task-master/webhook-interface";
import { PrdText } from "@taiga-task-master/common";
import { type ParseError, TreeFormatter } from "effect/ParseResult";
import { isLeft } from "effect/Either";

/**
 * Parses incoming HTTP request into WebhookRequest format
 */
export const parseRequest = async (
  req: IncomingMessage
): Promise<Either.Either<WebhookRequest, ParseError>> => {
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
  return pipe(
    Schema.decodeUnknownEither(WebhookPayload)(bodyJson),
    Either.map((payload) => ({
      headers: {
        "x-taiga-webhook-signature": ((h) => {
          const f = (h_: typeof h): string => {
            if (h_ === undefined) return "";
            if (typeof h_ === "string") return h_;
            return f(h_[0]);
          };
          return f(h);
        })(req.headers["x-taiga-webhook-signature"]),
      },
      body: payload,
      rawBody: bodyText, // Include original body string for signature validation
    }))
  );
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
  res.end(JSON.stringify(response.body || {}));
};

/**
 * Main webhook handler implementation for Taiga webhooks
 */
export const webhookHandler: WebhookHandler = (deps) => async (request) => {
  try {
    // Validate webhook signature using original raw body
    const signature = request.headers["x-taiga-webhook-signature"];

    if (
      !validateWebhookSignature(
        signature,
        request.rawBody,
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

    // Extract PRD from user story description and validate it
    const prdDescription = request.body.data.description;
    const prd = Schema.decodeSync(PrdText)(prdDescription);

    // Process PRD to generate tasks
    // First generate tasks to get count, then sync happens automatically
    const tasksContent = await deps.taskGeneratorDeps.taskmaster.generateTasks(
      prd,
      Option.none()
    );

    // Sync to Taiga (this is the full orchestration)
    await deps.generateTasks(deps.taskGeneratorDeps)(prd);

    // Count tasks in the generated content
    const tasksCount = Array.isArray(tasksContent.tasks)
      ? tasksContent.tasks.length
      : 0;

    return {
      status: 200,
      body: {
        message: `Successfully processed Taiga webhook for user story`,
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
      // Handle health check endpoint
      if (req.method === "GET" && req.url === "/health") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            status: "healthy",
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      // Only handle POST requests to /api/taiga-webhook
      if (req.method !== "POST" || req.url !== "/api/taiga-webhook") {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Not Found" }));
        return;
      }

      const request = await parseRequest(req);
      if (isLeft(request)) {
        const response: WebhookResponse = {
          status: 400,
          body: {
            error: `parse error: ${TreeFormatter.formatErrorSync(request.left)}`,
          },
        };
        return sendResponse(res, response);
      }
      const response = await handler(request.right);
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
      return sendResponse(res, response);
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
