"use client";

import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import {
  DEFAULT_REMOTE_CONFIG,
  parseRemoteConfig,
  type RemoteConfig,
} from "@/lib/remote-config";

/**
 * App-wide maintenance gate. While the config is loading — and whenever
 * maintenance is OFF (the default) — it renders children unchanged, so it is
 * a no-op by default. Self-fetches /api/config (no react-query dependency) so
 * it can sit at the very top of the tree.
 *
 * This is a *client* gate (brief flash of the app before it flips). The
 * flash-free, production-grade version is Edge Middleware reading Edge Config
 * — a deliberate follow-up so this PR touches no routing/auth.
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<RemoteConfig>(DEFAULT_REMOTE_CONFIG);

  useEffect(() => {
    let active = true;
    fetch("/api/config", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json) setConfig(parseRemoteConfig(json));
      })
      .catch(() => {
        /* keep safe defaults — never block the app on a config error */
      });
    return () => {
      active = false;
    };
  }, []);

  if (!config.maintenanceMode) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-workon-bg px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary">
        <Wrench className="h-7 w-7" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-workon-ink">
        Maintenance en cours
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-workon-muted">
        {config.maintenanceMessage ??
          "WorkOn est temporairement en maintenance. Revenez dans quelques minutes — merci de votre patience."}
      </p>
    </div>
  );
}
