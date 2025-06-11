import { Effect, Schema } from "effect";
import type {
  Worker,
  WorkerId,
  WorkerConfig,
  WorkerStatus,
  WorkerTaskAssignment,
  WorkerHeartbeat,
} from "./schemas.js";

/**
 * Worker service error types
 */
export type WorkerServiceError = 
  | Readonly<{ _tag: "WorkerNotFoundError"; workerId: WorkerId }>
  | Readonly<{ _tag: "WorkerRegistrationError"; message: string }>
  | Readonly<{ _tag: "WorkerUpdateError"; message: string }>
  | Readonly<{ _tag: "TaskAssignmentError"; message: string }>
  | Readonly<{ _tag: "HeartbeatError"; message: string }>
  | Readonly<{ _tag: "WorkerServiceError"; message: string }>;

/**
 * Worker service interface
 * Defines the contract for worker management operations
 */
export interface WorkerService {
  /**
   * Register a new worker
   */
  readonly registerWorker: (
    name: string,
    config: WorkerConfig
  ) => Effect.Effect<Worker, WorkerServiceError>;

  /**
   * Get worker by ID
   */
  readonly getWorker: (
    workerId: WorkerId
  ) => Effect.Effect<Worker, WorkerServiceError>;

  /**
   * List all workers with optional status filter
   */
  readonly listWorkers: (
    status?: WorkerStatus
  ) => Effect.Effect<readonly Worker[], WorkerServiceError>;

  /**
   * Update worker status
   */
  readonly updateWorkerStatus: (
    workerId: WorkerId,
    status: WorkerStatus
  ) => Effect.Effect<Worker, WorkerServiceError>;

  /**
   * Assign task to worker
   */
  readonly assignTask: (
    assignment: WorkerTaskAssignment
  ) => Effect.Effect<void, WorkerServiceError>;

  /**
   * Process worker heartbeat
   */
  readonly processHeartbeat: (
    heartbeat: WorkerHeartbeat
  ) => Effect.Effect<void, WorkerServiceError>;

  /**
   * Remove worker
   */
  readonly removeWorker: (
    workerId: WorkerId
  ) => Effect.Effect<void, WorkerServiceError>;
}

/**
 * Worker service response types for different operations
 */
export const WorkerServiceResponse = Schema.Union(
  Schema.Struct({
    success: Schema.Literal(true),
    data: Schema.Unknown,
  }),
  Schema.Struct({
    success: Schema.Literal(false),
    error: Schema.Struct({
      type: Schema.String,
      message: Schema.String,
    }),
  })
);

export type WorkerServiceResponse = Schema.Schema.Type<typeof WorkerServiceResponse>;