// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  acceptAllDocuments,
  cancelAccountDeletion,
  downloadMyDataAsJson,
  getActiveVersions,
  getMyData,
  normalizeLegalVersions,
  requestAccountDeletion,
} from "./compliance-api";

// Mock apiFetch so we can assert it was called with the right path + method
vi.mock("./api-client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "./api-client";
const mockedApiFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;

describe("compliance-api — data rights", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("getActiveVersions normalizes backend versions and uses skipAuth", async () => {
    mockedApiFetch.mockResolvedValueOnce({
      versions: { TERMS: "2026-05-terms", PRIVACY: "2026-05-privacy" },
      updatedAt: "2026-05-19T00:00:00Z",
    });

    const out = await getActiveVersions();

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/compliance/versions",
      { skipAuth: true },
    );
    expect(out.versions).toEqual({
      TERMS: "2026-05-terms",
      PRIVACY: "2026-05-privacy",
    });
  });

  it("acceptAllDocuments fetches active backend versions before accepting", async () => {
    mockedApiFetch
      .mockResolvedValueOnce({
        versions: { TERMS: "terms-live", PRIVACY: "privacy-live" },
      })
      .mockResolvedValueOnce({
        accepted: true,
        documentType: "TERMS",
        version: "terms-live",
        acceptedAt: "2026-05-19T00:00:00Z",
      })
      .mockResolvedValueOnce({
        accepted: true,
        documentType: "PRIVACY",
        version: "privacy-live",
        acceptedAt: "2026-05-19T00:00:00Z",
      });

    const out = await acceptAllDocuments("token");

    expect(out.success).toBe(true);
    expect(mockedApiFetch).toHaveBeenNthCalledWith(
      1,
      "/compliance/versions",
      { skipAuth: true },
    );
    expect(mockedApiFetch).toHaveBeenNthCalledWith(
      2,
      "/compliance/accept",
      {
        method: "POST",
        body: JSON.stringify({ documentType: "TERMS", version: "terms-live" }),
      },
    );
    expect(mockedApiFetch).toHaveBeenNthCalledWith(
      3,
      "/compliance/accept",
      {
        method: "POST",
        body: JSON.stringify({ documentType: "PRIVACY", version: "privacy-live" }),
      },
    );
  });

  it("normalizeLegalVersions falls back only for missing values", () => {
    expect(normalizeLegalVersions({ TERMS: "terms-live" })).toEqual({
      TERMS: "terms-live",
      PRIVACY: "1.0",
    });
  });

  it("getMyData calls /compliance/my-data", async () => {
    mockedApiFetch.mockResolvedValueOnce({
      exportedAt: "2026-04-19T00:00:00Z",
      user: { id: "u_1" },
      consents: [],
    });
    const out = await getMyData();
    expect(mockedApiFetch).toHaveBeenCalledWith("/compliance/my-data");
    expect(out.user).toEqual({ id: "u_1" });
  });

  it("requestAccountDeletion POSTs to /compliance/delete-account", async () => {
    mockedApiFetch.mockResolvedValueOnce({
      requestedAt: "2026-04-19T00:00:00Z",
      scheduledFor: "2026-05-19T00:00:00Z",
      graceDays: 30,
      canCancel: true,
    });
    const out = await requestAccountDeletion();
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/compliance/delete-account",
      { method: "POST" },
    );
    expect(out.graceDays).toBe(30);
  });

  it("cancelAccountDeletion DELETEs /compliance/delete-account", async () => {
    mockedApiFetch.mockResolvedValueOnce({
      success: true,
      message: "Annulée",
    });
    const out = await cancelAccountDeletion();
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/compliance/delete-account",
      { method: "DELETE" },
    );
    expect(out.success).toBe(true);
  });

  describe("downloadMyDataAsJson", () => {
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;
    let clickSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Minimal happy-path browser stubs — our function only uses these.
      const stubDoc = {
        createElement: vi.fn(() => {
          clickSpy = vi.fn();
          return {
            href: "",
            download: "",
            click: clickSpy,
          } as unknown as HTMLAnchorElement;
        }),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      };
      vi.stubGlobal("document", stubDoc);
      vi.stubGlobal("window", { document: stubDoc });

      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn(() => "blob:mock-url");
      URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.unstubAllGlobals();
    });

    it("fetches data and triggers a click on a synthesized anchor", async () => {
      mockedApiFetch.mockResolvedValueOnce({
        exportedAt: "2026-04-19T00:00:00Z",
        user: { id: "u_42" },
        consents: [],
      });

      await downloadMyDataAsJson();

      expect(mockedApiFetch).toHaveBeenCalledWith("/compliance/my-data");
      expect(URL.createObjectURL).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("throws a clear error when run server-side", async () => {
      vi.unstubAllGlobals();
      // Simulate server by removing window
      const originalWindow = globalThis.window;
      // @ts-expect-error — intentional
      delete globalThis.window;
      await expect(downloadMyDataAsJson()).rejects.toThrow(
        /must run in the browser/i,
      );
      globalThis.window = originalWindow;
    });
  });
});
