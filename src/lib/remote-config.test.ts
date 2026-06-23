import { describe, it, expect } from "vitest";
import {
  DEFAULT_REMOTE_CONFIG,
  isFeatureEnabled,
  parseRemoteConfig,
} from "./remote-config";

describe("remote-config", () => {
  it("returns safe defaults for empty/invalid input", () => {
    expect(parseRemoteConfig(null)).toEqual(DEFAULT_REMOTE_CONFIG);
    expect(parseRemoteConfig(undefined)).toEqual(DEFAULT_REMOTE_CONFIG);
    expect(parseRemoteConfig("nope")).toEqual(DEFAULT_REMOTE_CONFIG);
    expect(parseRemoteConfig([1, 2])).toEqual(DEFAULT_REMOTE_CONFIG);
  });

  it("defaults keep everything enabled and maintenance off", () => {
    expect(DEFAULT_REMOTE_CONFIG.maintenanceMode).toBe(false);
    expect(DEFAULT_REMOTE_CONFIG.disableAuth).toBe(false);
    expect(DEFAULT_REMOTE_CONFIG.disablePayments).toBe(false);
  });

  it("merges a partial object over defaults and coerces string booleans", () => {
    const cfg = parseRemoteConfig({
      maintenanceMode: "true",
      disablePayments: true,
      maintenanceMessage: "Retour à 14h",
      features: { swipe: false, map: "true", junk: 3 },
    });
    expect(cfg.maintenanceMode).toBe(true);
    expect(cfg.disablePayments).toBe(true);
    expect(cfg.disableAuth).toBe(false); // untouched -> default
    expect(cfg.maintenanceMessage).toBe("Retour à 14h");
    expect(cfg.features).toEqual({ swipe: false, map: true }); // junk dropped
  });

  it("isFeatureEnabled falls back to true for unknown flags", () => {
    const cfg = parseRemoteConfig({ features: { a: false } });
    expect(isFeatureEnabled(cfg, "a")).toBe(false);
    expect(isFeatureEnabled(cfg, "missing")).toBe(true);
    expect(isFeatureEnabled(cfg, "missing", false)).toBe(false);
  });
});
