"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_REMOTE_CONFIG,
  isFeatureEnabled,
  parseRemoteConfig,
  type RemoteConfig,
} from "@/lib/remote-config";

async function fetchRemoteConfig(): Promise<RemoteConfig> {
  const res = await fetch("/api/config", { cache: "no-store" });
  if (!res.ok) return DEFAULT_REMOTE_CONFIG;
  return parseRemoteConfig(await res.json());
}

/**
 * Live remote config on the client. Returns safe defaults until loaded and
 * on any error, so callers never crash. Relies on the react-query provider
 * already mounted app-wide in <Providers>.
 */
export function useRemoteConfig(): RemoteConfig {
  const { data } = useQuery({
    queryKey: ["remote-config"],
    queryFn: fetchRemoteConfig,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  return data ?? DEFAULT_REMOTE_CONFIG;
}

/** Convenience: whether a named feature flag is on (unknown -> `fallback`). */
export function useFeatureFlag(name: string, fallback = true): boolean {
  return isFeatureEnabled(useRemoteConfig(), name, fallback);
}
