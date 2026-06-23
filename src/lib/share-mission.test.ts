import { describe, it, expect, vi, afterEach } from "vitest";
import { buildMissionShareUrl, shareMission } from "./share-mission";

function setNavigatorProp(name: "share" | "clipboard", value: unknown) {
  Object.defineProperty(navigator, name, {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  // Remove anything we stubbed so tests stay isolated.
  setNavigatorProp("share", undefined);
  setNavigatorProp("clipboard", undefined);
  vi.restoreAllMocks();
});

describe("share-mission", () => {
  it("builds an absolute mission URL", () => {
    expect(buildMissionShareUrl("abc123")).toMatch(/\/missions\/abc123$/);
    expect(buildMissionShareUrl("abc123")).toMatch(/^https?:\/\//);
  });

  it("uses the native share sheet when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigatorProp("share", share);
    expect(await shareMission({ id: "1", title: "Ménage" })).toBe("shared");
    expect(share).toHaveBeenCalledOnce();
  });

  it("treats a cancelled share sheet as done (no fallback)", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigatorProp(
      "share",
      vi.fn().mockRejectedValue(new DOMException("cancel", "AbortError")),
    );
    setNavigatorProp("clipboard", { writeText });
    expect(await shareMission({ id: "1" })).toBe("shared");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("falls back to copying the link when share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigatorProp("clipboard", { writeText });
    expect(await shareMission({ id: "42" })).toBe("copied");
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0][0]).toMatch(/\/missions\/42$/);
  });

  it("returns 'failed' when neither share nor clipboard works", async () => {
    expect(await shareMission({ id: "1" })).toBe("failed");
  });
});
