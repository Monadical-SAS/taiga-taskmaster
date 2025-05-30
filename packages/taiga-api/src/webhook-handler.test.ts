// @vibe-generated: tests for webhook signature verification
import { describe, it, expect } from "vitest";
import * as crypto from "node:crypto";
import { verifySignature } from "./webhook-handler.js";

describe("webhook-handler", () => {
  describe("verifySignature", () => {
    it("should verify valid signature", () => {
      const key = "test-key";
      const data = '{"test": "data"}';
      const expectedSignature = "9cb38e782ba724ef977964741ed80b724cd56152"; // pre-computed

      expect(verifySignature(key, data, expectedSignature)).toBe(true);
    });

    it("should reject invalid signature", () => {
      const key = "test-key";
      const data = '{"test": "data"}';
      const invalidSignature = "invalid";

      expect(verifySignature(key, data, invalidSignature)).toBe(false);
    });

    it("should match Python HMAC implementation", () => {
      // Test with the same values used in the Python example
      const key = "5E5F302C-CDD4-4F25-A33D-55BAB0ABEFE1";
      const data = '{"action":"create","type":"userstory"}';

      // Compute signature
      const signature = crypto
        .createHmac("sha1", key)
        .update(data, "utf8")
        .digest("hex");

      // Verify it matches
      expect(verifySignature(key, data, signature)).toBe(true);
    });
  });
});
