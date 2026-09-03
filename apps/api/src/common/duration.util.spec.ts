import { durationToMs } from "./duration.util";

describe("durationToMs", () => {
  it("converts seconds", () => {
    expect(durationToMs("5s")).toBe(5000);
  });

  it("converts minutes", () => {
    expect(durationToMs("2m")).toBe(120000);
  });

  it("converts hours", () => {
    expect(durationToMs("1h")).toBe(3600000);
  });

  it("converts days", () => {
    expect(durationToMs("1d")).toBe(86400000);
  });

  it("defaults to milliseconds", () => {
    expect(durationToMs("1500")).toBe(1500);
  });
});
