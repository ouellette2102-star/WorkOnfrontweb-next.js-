// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./mode-context.tsx", import.meta.url), "utf8");

describe("ModeProvider role stability", () => {
  it("keeps Pro/Client mode local and never mutates the backend account role", () => {
    expect(source).not.toContain("@/lib/api-client");
    expect(source).not.toContain("updateProfile");
    expect(source).not.toContain("refreshUser");
    expect(source).toContain("safeLocalStorage.setItem(STORAGE_KEY, newMode)");
  });
});
