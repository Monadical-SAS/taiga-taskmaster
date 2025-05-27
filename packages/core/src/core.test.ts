import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { greet } from "./core.js";

describe("core", () => {
  it("should greet properly", () => {
    expect(greet("World")).toBe("Hello, World!");
  });
});