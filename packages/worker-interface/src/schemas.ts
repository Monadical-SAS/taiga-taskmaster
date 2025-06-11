import { Schema } from "effect";

/**
 * Worker identifier - branded type for type safety
 */
export const WorkerId = Schema.String.pipe(Schema.brand("WorkerId"));
export type WorkerId = Schema.Schema.Type<typeof WorkerId>;

/**
 * Worker status enumeration
 */
export const WorkerStatus = Schema.Literal("idle", "busy", "offline", "error");
export type WorkerStatus = Schema.Schema.Type<typeof WorkerStatus>;

/**
 * Worker configuration schema
 */
export const WorkerConfig = Schema.Struct({
  maxConcurrentTasks: Schema.Number.pipe(Schema.positive()),
  timeout: Schema.Number.pipe(Schema.positive()),
  retryAttempts: Schema.Number.pipe(Schema.nonNegative()),
});
export type WorkerConfig = Schema.Schema.Type<typeof WorkerConfig>;

/**
 * Worker schema definition
 */
export const Worker = Schema.Struct({
  id: WorkerId,
  name: Schema.String,
  status: WorkerStatus,
  config: WorkerConfig,
  createdAt: Schema.DateFromSelf,
  lastHeartbeat: Schema.optional(Schema.DateFromSelf),
});
export type Worker = Schema.Schema.Type<typeof Worker>;

/**
 * Worker task assignment schema
 */
export const WorkerTaskAssignment = Schema.Struct({
  workerId: WorkerId,
  taskId: Schema.String,
  assignedAt: Schema.DateFromSelf,
  priority: Schema.Number.pipe(Schema.between(1, 10)),
});
export type WorkerTaskAssignment = Schema.Schema.Type<typeof WorkerTaskAssignment>;

/**
 * Worker heartbeat schema
 */
export const WorkerHeartbeat = Schema.Struct({
  workerId: WorkerId,
  timestamp: Schema.DateFromSelf,
  status: WorkerStatus,
  currentTasks: Schema.Array(Schema.String),
});
export type WorkerHeartbeat = Schema.Schema.Type<typeof WorkerHeartbeat>;