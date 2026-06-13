import { describe, it, expect } from "vitest";
import { generateToken } from "./token";

describe("generateToken", () => {
  it("returns a 24-char url-safe token", () => {
    const t = generateToken();
    expect(t).toHaveLength(24);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns unique tokens", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});
