// @vibe-generated: tests for command validation
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect } from "vitest";
import { validateCommand, validateCommandSync } from "./validation.js";
import { Either } from "effect";

describe("Command Validation", () => {
  describe("Valid Commands", () => {
    it("should validate take_next_task command", () => {
      const command = { type: "take_next_task" as const };
      const result = validateCommand(command);
      expect(Either.isRight(result)).toBe(true);
    });

    it("should validate complete_current_task command", () => {
      const command = { type: "complete_current_task" as const };
      const result = validateCommand(command);
      expect(Either.isRight(result)).toBe(true);
    });

    it("should validate commit_artifact command", () => {
      const command = {
        type: "commit_artifact" as const,
        artifactId: "artifact-1",
      };
      const result = validateCommand(command);
      expect(Either.isRight(result)).toBe(true);
    });

    it("should validate agent_step with optional progressText", () => {
      const command1 = { type: "agent_step" as const };
      const command2 = {
        type: "agent_step" as const,
        progressText: "Working...",
      };

      expect(Either.isRight(validateCommand(command1))).toBe(true);
      expect(Either.isRight(validateCommand(command2))).toBe(true);
    });

    it("should validate agent_fail command", () => {
      const command = {
        type: "agent_fail" as const,
        errorMessage: "Something went wrong",
      };
      const result = validateCommand(command);
      expect(Either.isRight(result)).toBe(true);
    });
  });

  describe("Invalid Commands", () => {
    it("should reject invalid command type", () => {
      const command = { type: "invalid_command" as any };
      const result = validateCommand(command);
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should reject commit_artifact without artifactId", () => {
      const command = { type: "commit_artifact" as any };
      const result = validateCommand(command);
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should reject agent_fail without errorMessage", () => {
      const command = { type: "agent_fail" as any };
      const result = validateCommand(command);
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should throw with validateCommandSync for invalid command", () => {
      const command = { type: "invalid_command" as any };
      expect(() => validateCommandSync(command)).toThrow();
    });
  });
});
