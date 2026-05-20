// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

describe("auth proxy error forwarding", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("preserves backend code and requestId on login errors", async () => {
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid credentials",
              status: 401,
              requestId: "req_login",
            },
          }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        ),
      ),
    );

    const { POST } = await import("./login/route");
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "audit@example.com",
          password: "WrongPassword123!",
        }),
      }) as unknown as NextRequest,
    );

    await expect(response.json()).resolves.toEqual({
      message: "Invalid credentials",
      code: "UNAUTHORIZED",
      status: 401,
      requestId: "req_login",
      error: {
        message: "Invalid credentials",
        code: "UNAUTHORIZED",
        status: 401,
        requestId: "req_login",
      },
    });
    expect(response.status).toBe(401);
  });

  it("keeps refresh failures as 401 while forwarding backend proof fields", async () => {
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "TOKEN_EXPIRED",
              message: "Refresh token expired",
              status: 401,
              requestId: "req_refresh",
            },
          }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        ),
      ),
    );

    const { POST } = await import("./refresh/route");
    const response = await POST({
      cookies: {
        get: (name: string) =>
          name === "workon_refresh" ? { value: "expired-refresh" } : undefined,
      },
    } as unknown as NextRequest);

    await expect(response.json()).resolves.toMatchObject({
      message: "Refresh token expired",
      code: "TOKEN_EXPIRED",
      status: 401,
      requestId: "req_refresh",
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("workon_token");
  });
});

