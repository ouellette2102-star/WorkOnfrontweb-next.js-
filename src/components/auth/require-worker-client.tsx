"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentProfile } from "@/hooks/use-current-profile";

export function RequireWorkerClient({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useCurrentProfile();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      router.push("/onboarding/role");
      return;
    }

    if (!profile.primaryRole) {
      router.push("/onboarding/role");
      return;
    }

    if (profile.primaryRole === "EMPLOYER") {
      router.push("/employer/dashboard");
      return;
    }

    if (profile.primaryRole !== "WORKER") {
      router.push("/onboarding/role");
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="text-white/70">Chargement...</div>
      </div>
    );
  }

  if (!profile || !profile.primaryRole || profile.primaryRole !== "WORKER") {
    return null;
  }

  return <>{children}</>;
}

