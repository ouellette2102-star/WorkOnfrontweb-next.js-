// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseDateOnlyFromApi } from "./date-only";

describe("parseDateOnlyFromApi", () => {
  it("keeps UTC-midnight API dates on their intended calendar day", () => {
    const date = parseDateOnlyFromApi("2026-07-08T00:00:00.000Z");

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(8);
  });

  it("parses date-only strings the same way", () => {
    const date = parseDateOnlyFromApi("2026-07-08");

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(8);
  });

  it("rejects invalid calendar dates", () => {
    expect(parseDateOnlyFromApi("2026-02-31T00:00:00.000Z")).toBeNull();
  });
});
