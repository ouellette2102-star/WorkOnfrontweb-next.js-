/**
 * Health Check Endpoint
 * 
 * Simple endpoint for monitoring and load balancer health checks.
 * No database access, no side effects.
 * 
 * GET /api/health
 */

import { NextResponse } from "next/server";

interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  version: string;
  environment: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const response: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
    environment: process.env.NODE_ENV ?? "unknown",
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

