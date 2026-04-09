"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { CreateMissionForm } from "@/components/missions/create-mission-form";

export default function NewMissionPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/missions/new");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#FF4D1C] border-t-transparent" />
          <p className="text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-900 py-12">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Créer une mission
          </h1>
          <p className="text-white/70">
            Publie une mission pour trouver rapidement des travailleurs qualifiés
          </p>
        </div>

        {/* Formulaire */}
        <div className="rounded-3xl border border-white/10 bg-neutral-800/80 backdrop-blur-sm p-8 shadow-lg shadow-black/20">
          <CreateMissionForm />
        </div>
      </div>
    </div>
  );
}
