"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Redirect page: /sign-up -> /register
 * Preserves query params (e.g., ?role=worker) so old CTAs and bookmarks still work.
 */
export default function SignUpRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(params ? `/register?${params}` : "/register");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900">
      <p className="text-white/70">Redirection...</p>
    </div>
  );
}
