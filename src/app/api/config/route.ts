import { NextResponse } from "next/server";
import { getRemoteConfig } from "@/lib/remote-config";

/**
 * GET /api/config — public runtime config snapshot (kill-switches,
 * maintenance, feature flags). Evaluated at request time so flipping the
 * source (REMOTE_CONFIG env, or Edge Config later) takes effect without a
 * code change. Never errors: getRemoteConfig() falls back to safe defaults.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getRemoteConfig(), {
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
    },
  });
}
