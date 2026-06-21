import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

const FORWARDED_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "accept-language",
] as const;

const HOP_BY_HOP_RESPONSE_HEADERS = [
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
] as const;

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildBackendUrl(pathSegments: string[], search: string) {
  const encodedPath = pathSegments.map(encodeURIComponent).join("/");
  return `${API_URL}/${encodedPath}${search}`;
}

function buildForwardHeaders(request: NextRequest) {
  const headers = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  return headers;
}

function buildResponseHeaders(backendHeaders: Headers) {
  const headers = new Headers(backendHeaders);

  for (const name of HOP_BY_HOP_RESPONSE_HEADERS) {
    headers.delete(name);
  }

  return headers;
}

async function proxyWorkOnRequest(
  request: NextRequest,
  context: RouteContext,
) {
  const { path = [] } = await context.params;

  if (path.length === 0) {
    return NextResponse.json({ message: "Chemin API manquant" }, { status: 400 });
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const backendResponse = await fetch(
      buildBackendUrl(path, request.nextUrl.search),
      {
        method,
        headers: buildForwardHeaders(request),
        body,
        cache: "no-store",
      },
    );

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: buildResponseHeaders(backendResponse.headers),
    });
  } catch {
    return NextResponse.json(
      { message: "Backend WorkOn indisponible" },
      { status: 502 },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
  });
}

export const GET = proxyWorkOnRequest;
export const POST = proxyWorkOnRequest;
export const PUT = proxyWorkOnRequest;
export const PATCH = proxyWorkOnRequest;
export const DELETE = proxyWorkOnRequest;
