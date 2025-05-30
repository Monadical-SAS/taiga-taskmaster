// @vibe-generated: webhook signature verification utility
import * as crypto from "node:crypto";

/**
 * Verifies webhook signature using HMAC-SHA1
 * This matches the Python implementation: hmac.new(key, data, hashlib.sha1)
 */
export function verifySignature(
  key: string,
  data: string,
  signature: string
): boolean {
  const mac = crypto.createHmac("sha1", key);
  mac.update(data, "utf8");
  const computedSignature = mac.digest("hex");
  return computedSignature === signature;
}
