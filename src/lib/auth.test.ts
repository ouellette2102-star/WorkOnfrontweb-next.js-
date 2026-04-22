// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// Stub the browser-only safe-storage + window.localStorage before
// importing auth so the module-eval-time call to safeLocalStorage
// doesn't crash under the node environment.
vi.mock("@/lib/safe-storage", () => ({
  safeLocalStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const { refreshToken } = await import("./auth");

/**
 * Regression test for the refresh-token race condition.
 *
 * Before this fix, every 401 from `api-client.ts` fired its own
 * `/api/auth/refresh` call. The backend now single-uses refresh
 * tokens (rotation + blacklist, PR #285) so all but the first
 * parallel call got a 401, which triggered a full logout.
 *
 * The fix is an in-flight promise mutex: concurrent callers share
 * a single refresh request.
 */
describe("refreshToken — in-flight dedup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fires exactly one /api/auth/refresh for N parallel callers", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(
                  JSON.stringify({
                    accessToken: "new-access",
                    refreshToken: "new-refresh",
                  }),
                  { status: 200, headers: { "content-type": "application/json" } },
                ),
              ),
            50,
          ),
        ),
    );

    const results = await Promise.all([
      refreshToken(),
      refreshToken(),
      refreshToken(),
      refreshToken(),
      refreshToken(),
    ]);

    // Single underlying network call, shared across 5 callers.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    // Every caller got the same resolved access token.
    for (const r of results) {
      expect(r).toBe("new-access");
    }
  });

  it("releases the mutex after resolve so a later genuine expiry can refresh again", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ accessToken: "a", refreshToken: "r" }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await refreshToken();
    await refreshToken();
    await refreshToken();

    // Three *sequential* refreshes (not parallel) → three network calls.
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
