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

const { safeLocalStorage } = await import("@/lib/safe-storage");
const { fetchCurrentUser, refreshToken } = await import("./auth");

function makeJwt(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${encoded}.signature`;
}

const user = {
  id: "local_user_cookie",
  email: "mathieu@example.com",
  firstName: "Mathieu",
  lastName: "Ouellette",
  phone: null,
  city: "Montreal",
  pictureUrl: null,
  role: "worker",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

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
    vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
    vi.mocked(safeLocalStorage.setItem).mockClear();
    vi.mocked(safeLocalStorage.removeItem).mockClear();
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

describe("fetchCurrentUser session sync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
    vi.mocked(safeLocalStorage.setItem).mockClear();
    vi.mocked(safeLocalStorage.removeItem).mockClear();
  });

  it("refreshes localStorage tokens when the cookie user differs from the local access token", async () => {
    vi.mocked(safeLocalStorage.getItem).mockImplementation((key) => {
      if (key === "workon_access_token") {
        return makeJwt({ sub: "different_user", role: "employer" });
      }
      return null;
    });

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (input === "/api/auth/me") {
        return Promise.resolve(
          new Response(JSON.stringify(user), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }
      if (input === "/api/auth/refresh") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              accessToken: "cookie-synced-access",
              refreshToken: "cookie-synced-refresh",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }
      throw new Error(`unexpected fetch ${String(input)}`);
    });

    await expect(fetchCurrentUser()).resolves.toEqual(user);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "workon_access_token",
      "cookie-synced-access",
    );
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "workon_refresh_token",
      "cookie-synced-refresh",
    );
  });

  it("keeps the local token when it already matches the cookie user", async () => {
    vi.mocked(safeLocalStorage.getItem).mockImplementation((key) => {
      if (key === "workon_access_token") {
        return makeJwt({ sub: user.id, role: user.role });
      }
      return null;
    });

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(user), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchCurrentUser()).resolves.toEqual(user);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
  });
});
