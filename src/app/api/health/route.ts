/**
 * Healthcheck API
 * PR-28: Ops & monitoring minimum
 *
 * Retourne le statut de l'application.
 * Utilisé par les load balancers, monitoring, etc.
 *
 * Statuts possibles:
 * - "healthy": tout fonctionne
 * - "degraded": certains services indisponibles
 * - "unhealthy": problème critique
 */

import { NextResponse } from "next/server";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

type HealthResponse = {
  status: HealthStatus;
  timestamp: string;
  version: string;
  checks: {
    api: boolean;
    backend?: boolean;
  };
  details?: Record<string, string>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version ?? "1.0.0";

  const checks = {
    api: true, // Frontend API is always true if we reach this point
    backend: false,
  };

  const details: Record<string, string> = {};

  // Check backend connectivity (non-blocking, timeout court)
  if (API_BASE_URL) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      checks.backend = response.ok;
      if (!response.ok) {
        details.backend = `Status ${response.status}`;
      }
    } catch (error) {
      checks.backend = false;
      if (error instanceof Error && error.name === "AbortError") {
        details.backend = "Timeout";
      } else {
        details.backend = "Unreachable";
      }
    }
  } else {
    details.backend = "Not configured";
  }

  // Determine overall status
  let status: HealthStatus = "healthy";

  if (!checks.backend) {
    status = "degraded"; // Frontend works, but backend might be down
  }

  // If frontend has issues (shouldn't happen if we reach here)
  if (!checks.api) {
    status = "unhealthy";
  }

  const response: HealthResponse = {
    status,
    timestamp,
    version,
    checks,
  };

  // Include details only if there are issues
  if (Object.keys(details).length > 0) {
    response.details = details;
  }

  // Return 200 for healthy/degraded, 503 for unhealthy
  const httpStatus = status === "unhealthy" ? 503 : 200;

  return NextResponse.json(response, { status: httpStatus });
}



