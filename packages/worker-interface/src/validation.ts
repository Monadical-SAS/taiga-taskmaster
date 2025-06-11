import { Either, Schema } from "effect";
import { ParseError } from "effect/ParseResult";
import {
  Worker,
  WorkerId,
  WorkerConfig,
  WorkerHeartbeat,
  WorkerTaskAssignment,
} from "./schemas.js";

/**
 * Validation utilities for worker schemas
 */

/**
 * Validate worker configuration
 * Invariant: maxConcurrentTasks > 0, timeout > 0, retryAttempts >= 0
 */
export const validateWorkerConfig = (
  input: unknown
): Either.Either<WorkerConfig, ParseError> =>
  Schema.decodeUnknownEither(WorkerConfig)(input);

/**
 * Validate worker data
 */
export const validateWorker = (
  input: unknown
): Either.Either<Worker, ParseError> =>
  Schema.decodeUnknownEither(Worker)(input);

/**
 * Validate worker ID
 */
export const validateWorkerId = (
  input: unknown
): Either.Either<WorkerId, ParseError> =>
  Schema.decodeUnknownEither(WorkerId)(input);

/**
 * Validate worker heartbeat
 */
export const validateWorkerHeartbeat = (
  input: unknown
): Either.Either<WorkerHeartbeat, ParseError> =>
  Schema.decodeUnknownEither(WorkerHeartbeat)(input);

/**
 * Validate worker task assignment
 */
export const validateWorkerTaskAssignment = (
  input: unknown
): Either.Either<WorkerTaskAssignment, ParseError> =>
  Schema.decodeUnknownEither(WorkerTaskAssignment)(input);

/**
 * Type guards for runtime checks
 */

/**
 * Check if worker is active (not offline or error)
 */
export const isWorkerActive = (worker: Worker): boolean =>
  worker.status === "idle" || worker.status === "busy";

/**
 * Check if worker can accept new tasks
 */
export const canWorkerAcceptTasks = (
  worker: Worker,
  currentTaskCount: number
): boolean =>
  worker.status === "idle" && currentTaskCount < worker.config.maxConcurrentTasks;