import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { greet, TaskFileStructure } from "./core.js";

describe("core", () => {
  it("should greet properly", () => {
    expect(greet("World")).toBe("Hello, World!");
  });
});

describe("TaskFileStructure", () => {
  it("should accept empty object", () => {
    const result = Schema.decodeUnknownEither(TaskFileStructure)({});
    expect(result._tag).toBe("Right");
  });

  it("should accept valid consecutive structure starting from 1", () => {
    const validData = {
      "1": "First task",
      "2": "Second task",
      "3": "Third task"
    };
    const result = Schema.decodeUnknownEither(TaskFileStructure)(validData);
    expect(result._tag).toBe("Right");
  });

  it("should accept single item with key 1", () => {
    const validData = {
      "1": "Only task"
    };
    const result = Schema.decodeUnknownEither(TaskFileStructure)(validData);
    expect(result._tag).toBe("Right");
  });

  it("should reject structure not starting with 1", () => {
    const invalidData = {
      "2": "Second task",
      "3": "Third task"
    };
    const result = Schema.decodeUnknownEither(TaskFileStructure)(invalidData);
    expect(result._tag).toBe("Left");
  });

  it("should reject non-consecutive keys", () => {
    const invalidData = {
      "1": "First task",
      "3": "Third task"
    };
    const result = Schema.decodeUnknownEither(TaskFileStructure)(invalidData);
    expect(result._tag).toBe("Left");
  });

  it("should reject empty string values", () => {
    const invalidData = {
      "1": ""
    };
    const result = Schema.decodeUnknownEither(TaskFileStructure)(invalidData);
    expect(result._tag).toBe("Left");
  });

  it("should reject negative keys", () => {
    const invalidData = {
      "-1": "Negative task"
    };
    const result = Schema.decodeUnknownEither(TaskFileStructure)(invalidData);
    expect(result._tag).toBe("Left");
  });

  it("should reject zero key", () => {
    const invalidData = {
      "0": "Zero task"
    };
    const result = Schema.decodeUnknownEither(TaskFileStructure)(invalidData);
    expect(result._tag).toBe("Left");
  });
});