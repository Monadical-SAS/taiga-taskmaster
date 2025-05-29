// @vibe-generated: conforms to taskmaster-interface
import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import {
  SINGLETON_PROJECT_ID,
  TaskId as TaskIdSchema,
} from "@taiga-task-master/common";

// Import from local tags module
import {
  type ProjectIdTag,
  type TaskIdTag,
  encodeProjectIdToTag,
  decodeProjectIdFromTag,
  encodeTaskIdToTag,
  decodeTaskIdFromTag,
  PROJECT_ID_TAG_PREFIX,
  TASK_ID_TAG_PREFIX,
} from "./tags.js";

describe("Tag Management System", () => {
  const createTaskId = (n: number) => Schema.decodeSync(TaskIdSchema)(n);
  const testProjectId = SINGLETON_PROJECT_ID;
  const testTaskId = createTaskId(42);

  describe("ProjectId Codec", () => {
    it("should encode ProjectId to ProjectIdTag", () => {
      const tag = encodeProjectIdToTag(testProjectId);
      expect(tag).toBe(`${PROJECT_ID_TAG_PREFIX}${testProjectId}`);
    });

    it("should decode ProjectIdTag to ProjectId", () => {
      const tag = encodeProjectIdToTag(testProjectId);
      const decoded = decodeProjectIdFromTag(tag);
      expect(decoded).toBe(testProjectId);
    });

    it("should throw error for invalid ProjectIdTag format", () => {
      const invalidTag = "invalid-tag" as ProjectIdTag;
      expect(() => decodeProjectIdFromTag(invalidTag)).toThrow();
    });
  });

  describe("TaskId Codec", () => {
    it("should encode TaskId to TaskIdTag", () => {
      const tag = encodeTaskIdToTag(testTaskId);
      expect(tag).toBe(`${TASK_ID_TAG_PREFIX}${testTaskId}`);
    });

    it("should decode TaskIdTag to TaskId", () => {
      const tag = encodeTaskIdToTag(testTaskId);
      const decoded = decodeTaskIdFromTag(tag);
      expect(decoded).toBe(testTaskId);
    });

    it("should throw error for invalid TaskIdTag format", () => {
      const invalidTag = "invalid-tag" as TaskIdTag;
      expect(() => decodeTaskIdFromTag(invalidTag)).toThrow();
    });

    it("should throw error for invalid TaskId in TaskIdTag", () => {
      const invalidTag = `${TASK_ID_TAG_PREFIX}invalid` as TaskIdTag;
      expect(() => decodeTaskIdFromTag(invalidTag)).toThrow();
    });

    it("should throw error for negative TaskId in TaskIdTag", () => {
      const invalidTag = `${TASK_ID_TAG_PREFIX}-1` as TaskIdTag;
      expect(() => decodeTaskIdFromTag(invalidTag)).toThrow();
    });
  });

  describe("Round-trip Conversion", () => {
    it("should preserve ProjectId through codec round-trip", () => {
      const originalId = testProjectId;
      const tag = encodeProjectIdToTag(originalId);
      const decodedId = decodeProjectIdFromTag(tag);
      expect(decodedId).toBe(originalId);
    });

    it("should preserve TaskId through codec round-trip", () => {
      const originalId = testTaskId;
      const tag = encodeTaskIdToTag(originalId);
      const decodedId = decodeTaskIdFromTag(tag);
      expect(decodedId).toBe(originalId);
    });

    it("should work with multiple TaskIds", () => {
      const taskIds = [createTaskId(1), createTaskId(100), createTaskId(9999)];
      const tags = taskIds.map(encodeTaskIdToTag);
      const decodedIds = tags.map(decodeTaskIdFromTag);
      expect(decodedIds).toEqual(taskIds);
    });
  });
});
