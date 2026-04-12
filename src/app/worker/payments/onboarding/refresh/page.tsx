"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StripeOnboardingRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger immédiatement vers la page payments
    router.push("/worker/payments");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F8F5]">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#134021] border-t-transparent"></div>
        <p className="text-[#706E6A]">Redirection...</p>
      </div>
    </div>
  );
}

