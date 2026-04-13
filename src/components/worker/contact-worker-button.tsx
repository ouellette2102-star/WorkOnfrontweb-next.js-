"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface ContactWorkerButtonProps {
  workerId: string;
  workerFirstName: string;
  workerCategory?: string;
  workerCity?: string;
}

export function ContactWorkerButton({
  workerId,
  workerFirstName,
  workerCategory,
  workerCity,
}: ContactWorkerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleContact = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const mission = await api.createMission({
        title: `Demande - ${workerCategory || "Service"}`,
        description: "Demande de contact via WorkOn",
        category: workerCategory || "other",
        price: 0,
        latitude: 45.5017,
        longitude: -73.5673,
        city: workerCity || "Montreal",
      });

      await api.sendMessage({
        missionId: mission.id,
        content: `Bonjour ${workerFirstName}, je suis intéressé par vos services.`,
      });

      router.push(`/messages/${mission.id}`);
    } catch (err) {
      console.error("Contact error:", err);
      toast.error("Impossible de contacter ce professionnel. Réessayez.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleContact}
      disabled={loading}
      className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-workon-accent text-white text-sm font-medium py-2 hover:bg-workon-accent/90 transition-colors disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <MessageCircle className="h-3.5 w-3.5" />
      )}
      {loading ? "Connexion..." : "Contacter"}
    </button>
  );
}
