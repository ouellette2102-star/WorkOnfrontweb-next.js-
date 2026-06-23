import { describe, it, expect, vi, beforeEach } from "vitest";

const captureMessage = vi.fn();
const addBreadcrumb = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  captureMessage: (...args: unknown[]) => captureMessage(...args),
  addBreadcrumb: (...args: unknown[]) => addBreadcrumb(...args),
}));

import { trackEvent, trackMissionCardClick } from "./analytics";

type CaptureOpts = {
  level?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

beforeEach(() => {
  captureMessage.mockReset();
  addBreadcrumb.mockReset();
});

describe("trackEvent", () => {
  it("captures the event name with an `event` tag at info level", () => {
    trackEvent("account_registered", { role: "worker" });

    expect(captureMessage).toHaveBeenCalledTimes(1);
    const [message, opts] = captureMessage.mock.calls[0] as [string, CaptureOpts];
    expect(message).toBe("account_registered");
    expect(opts.level).toBe("info");
    expect(opts.tags).toMatchObject({ event: "account_registered", role: "worker" });
  });

  it("stringifies props into tags and drops undefined values", () => {
    trackEvent("mission_created", {
      category: "cleaning",
      price: 120,
      urgent: undefined,
    });

    const [, opts] = captureMessage.mock.calls[0] as [string, CaptureOpts];
    expect(opts.tags).toMatchObject({
      event: "mission_created",
      category: "cleaning",
      price: "120",
    });
    expect("urgent" in (opts.tags ?? {})).toBe(false);
  });

  it("adds a product breadcrumb carrying the raw props", () => {
    trackEvent("mission_created", { category: "cleaning" });

    expect(addBreadcrumb).toHaveBeenCalledTimes(1);
    const [crumb] = addBreadcrumb.mock.calls[0] as [
      { category: string; message: string; data: unknown },
    ];
    expect(crumb).toMatchObject({
      category: "product",
      message: "mission_created",
      data: { category: "cleaning" },
    });
  });

  it("emits only the `event` tag when no props are given", () => {
    trackEvent("account_registered");
    const [, opts] = captureMessage.mock.calls[0] as [string, CaptureOpts];
    expect(opts.tags).toEqual({ event: "account_registered" });
  });

  it("never throws when Sentry fails", () => {
    captureMessage.mockImplementationOnce(() => {
      throw new Error("sentry down");
    });
    expect(() => trackEvent("account_registered")).not.toThrow();
  });
});

describe("trackMissionCardClick (unchanged contract)", () => {
  it("captures mission_card_click with segmentation tags", () => {
    trackMissionCardClick({
      missionId: "m_1",
      variant: "pro",
      source: "public_feed",
      hasPhoto: true,
      viaCTA: false,
    });

    expect(captureMessage).toHaveBeenCalledWith(
      "mission_card_click",
      expect.objectContaining({
        level: "info",
        tags: expect.objectContaining({
          event: "mission_card_click",
          variant: "pro",
          source: "public_feed",
        }),
      }),
    );
  });

  it("never throws when Sentry fails", () => {
    captureMessage.mockImplementationOnce(() => {
      throw new Error("sentry down");
    });
    expect(() =>
      trackMissionCardClick({
        missionId: "m",
        variant: "pro",
        source: "other",
        hasPhoto: false,
        viaCTA: false,
      }),
    ).not.toThrow();
  });
});
