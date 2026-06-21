import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getFeaturedWorkers, getPublicMissions } from "./public-api";

describe("public-api browser transport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("routes browser public worker calls through the same-origin proxy", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await getFeaturedWorkers(24);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/workon/public/workers/featured?limit=24");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });

  it("keeps always-fresh browser public mission calls on the proxy", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ missions: [], total: 0, page: 1 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await getPublicMissions({ category: "snow_removal", city: "Montreal", page: 2, limit: 12 });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/workon/public/missions?category=snow_removal&city=Montreal&page=2&limit=12");
    expect(init?.cache).toBe("no-store");
  });
});
