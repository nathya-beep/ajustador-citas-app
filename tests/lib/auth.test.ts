import { describe, it, expect, beforeAll } from "vitest";
import { createSessionToken, verifySessionToken, SESSION_MAX_AGE_MS } from "@/lib/auth";
import crypto from "crypto";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret";
});

describe("session tokens", () => {
  it("verifies a freshly created token", () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken();
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(verifySessionToken(tampered)).toBe(false);
  });

  it("rejects a malformed token", () => {
    expect(verifySessionToken("not-a-real-token")).toBe(false);
  });

  it("rejects an expired token", () => {
    const expiredTimestamp = (Date.now() - SESSION_MAX_AGE_MS - 1000).toString();
    const signature = crypto
      .createHmac("sha256", "test-secret")
      .update(expiredTimestamp)
      .digest("hex");
    const expiredToken = `${expiredTimestamp}.${signature}`;
    expect(verifySessionToken(expiredToken)).toBe(false);
  });
});
