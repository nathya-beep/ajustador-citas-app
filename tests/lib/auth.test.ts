import { describe, it, expect, beforeAll } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth";

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
});
