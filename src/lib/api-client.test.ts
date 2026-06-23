// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({
  getAccessToken: vi.fn(() => "test-access-token"),
  refreshToken: vi.fn(),
}));

const { api, apiFetch } = await import("./api-client");

afterEach(() => {
  vi.unstubAllGlobals();
});

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

describe("apiFetch transport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses the same-origin WorkOn proxy in the browser to avoid preview CORS", async () => {
    vi.stubGlobal("window", {});
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(apiFetch("/users/me?source=test")).resolves.toEqual({ ok: true });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/workon/users/me?source=test");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer test-access-token",
    );
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

describe("api.createMission", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the documented /missions-local payload with an enum category", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "lm_test",
          title: "Deneigement entree",
          description: "Mission test",
          category: "snow_removal",
          status: "open",
          price: 75,
          latitude: 45.5017,
          longitude: -73.5673,
          city: "Montreal",
          address: null,
          createdByUserId: "usr_test",
          assignedToUserId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        {
          status: 201,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    await api.createMission({
      title: "Deneigement entree",
      description: "Mission test",
      category: "snow_removal",
      price: 75,
      latitude: 45.5017,
      longitude: -73.5673,
      city: "Montreal",
      address: "123 Audit Street",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/api/v1/missions-local");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      title: "Deneigement entree",
      category: "snow_removal",
      price: 75,
      latitude: 45.5017,
      longitude: -73.5673,
      city: "Montreal",
    });
  });
});

describe("api.updateNotificationPreference", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps settings toggles to the backend *Enabled DTO fields", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          type: "MESSAGE",
          emailEnabled: true,
          pushEnabled: false,
          smsEnabled: false,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    await api.updateNotificationPreference("MESSAGE", {
      email: true,
      push: false,
      sms: false,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe(
      "/api/v1/notifications/preferences/MESSAGE",
    );
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toEqual({
      emailEnabled: true,
      pushEnabled: false,
      smsEnabled: false,
    });
  });
});

