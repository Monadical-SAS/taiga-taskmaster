// @vibe-generated: Effect Schema validation for simulation commands

import { Schema } from "effect";

// Command schemas with proper validation
export const TakeNextTaskCommandSchema = Schema.Struct({
  type: Schema.Literal("take_next_task"),
});

export const CompleteCurrentTaskCommandSchema = Schema.Struct({
  type: Schema.Literal("complete_current_task"),
});

export const CommitArtifactCommandSchema = Schema.Struct({
  type: Schema.Literal("commit_artifact"),
  artifactId: Schema.String, // Would use ArtifactId schema in production
});

export const AppendTasksCommandSchema = Schema.Struct({
  type: Schema.Literal("append_tasks"),
  tasks: Schema.Any, // Would use proper Tasks schema in production
});

export const AgentStepCommandSchema = Schema.Struct({
  type: Schema.Literal("agent_step"),
  progressText: Schema.optional(Schema.String),
});

export const AgentFailCommandSchema = Schema.Struct({
  type: Schema.Literal("agent_fail"),
  errorMessage: Schema.String,
});

// Union of all command schemas
export const SimulationCommandSchema = Schema.Union(
  TakeNextTaskCommandSchema,
  CompleteCurrentTaskCommandSchema,
  CommitArtifactCommandSchema,
  AppendTasksCommandSchema,
  AgentStepCommandSchema,
  AgentFailCommandSchema
);

export type ValidatedSimulationCommand = Schema.Schema.Type<
  typeof SimulationCommandSchema
>;

// Validation function that returns Either
export const validateCommand = Schema.decodeEither(SimulationCommandSchema);

// Validation function that throws on error (for convenience)
export const validateCommandSync = Schema.decodeSync(SimulationCommandSchema);
