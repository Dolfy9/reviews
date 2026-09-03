import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-2 py-2", "px-4")).toBe("py-2 px-4");
  });
});
