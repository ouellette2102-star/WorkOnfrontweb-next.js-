// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./[...path]/route";

function makeRequest(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
): NextRequest {
  return new NextRequest(url, init);
}

function makeContext(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

describe("/api/workon proxy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards path, query and selected headers to the backend", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "u_1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET(
      makeRequest("https://workonapp.vercel.app/api/workon/users/me?x=1", {
        headers: {
          authorization: "Bearer test",
          accept: "application/json",
        },
      }),
      makeContext(["users", "me"]),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "u_1" });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/users\/me\?x=1$/),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
      }),
    );
    const init = fetchSpy.mock.calls[0][1];
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test");
  });

  it("forwards JSON bodies for mutating requests", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ saved: true }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(
      makeRequest("https://workonapp.vercel.app/api/workon/missions-local", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test",
        },
        body: JSON.stringify({ title: "Mission" }),
      }),
      makeContext(["missions-local"]),
    );

    expect(response.status).toBe(201);
    const forwardedBody = fetchSpy.mock.calls[0][1]?.body as ArrayBuffer;
    expect(Buffer.from(forwardedBody).toString("utf8")).toBe(
      JSON.stringify({ title: "Mission" }),
    );
  });
});
