import { hashToken, generateToken } from "./hash.util";

describe("hashToken", () => {
  it("returns a deterministic sha256 hex string", () => {
    expect(hashToken("hello")).toBe(hashToken("hello"));
    expect(hashToken("hello")).not.toBe(hashToken("world"));
  });
});

describe("generateToken", () => {
  it("returns a unique uuid v4 string", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(typeof a).toBe("string");
    expect(a.length).toBe(36);
  });
});
