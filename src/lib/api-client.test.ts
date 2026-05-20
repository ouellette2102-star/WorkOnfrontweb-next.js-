// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({
  getAccessToken: vi.fn(() => "test-access-token"),
  refreshToken: vi.fn(),
}));

const { api } = await import("./api-client");

describe("api.getNearbyMissions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the documented radius query param for /missions-local/nearby", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await api.getNearbyMissions({
      latitude: 45.5017,
      longitude: -73.5673,
      radius: 25,
      category: "cleaning",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/v1/missions-local/nearby");
    expect(url.searchParams.get("latitude")).toBe("45.5017");
    expect(url.searchParams.get("longitude")).toBe("-73.5673");
    expect(url.searchParams.get("radius")).toBe("25");
    expect(url.searchParams.has("radiusKm")).toBe(false);
    expect(url.searchParams.get("category")).toBe("cleaning");
  });
});

describe("api.getMissionMapPins", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the live bbox query params for /missions-local/map", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ missions: [], count: 0 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await api.getMissionMapPins({
      north: 45.55,
      south: 45.45,
      east: -73.5,
      west: -73.7,
      category: "plumbing",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/v1/missions-local/map");
    expect(url.searchParams.get("north")).toBe("45.55");
    expect(url.searchParams.get("south")).toBe("45.45");
    expect(url.searchParams.get("east")).toBe("-73.5");
    expect(url.searchParams.get("west")).toBe("-73.7");
    expect(url.searchParams.get("category")).toBe("plumbing");
    expect(url.searchParams.has("minLat")).toBe(false);
    expect(url.searchParams.has("maxLat")).toBe(false);
    expect(url.searchParams.has("minLng")).toBe(false);
    expect(url.searchParams.has("maxLng")).toBe(false);
  });
});

