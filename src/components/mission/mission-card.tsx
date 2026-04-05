"use client";

import Link from "next/link";
import { MapPin, Clock, DollarSign } from "lucide-react";
import type { MissionResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Ouverte", color: "bg-green-500/20 text-green-400" },
  assigned: { label: "Assignée", color: "bg-blue-500/20 text-blue-400" },
  in_progress: { label: "En cours", color: "bg-yellow-500/20 text-yellow-400" },
  completed: { label: "Terminée", color: "bg-purple-500/20 text-purple-400" },
  paid: { label: "Payée", color: "bg-green-500/20 text-green-400" },
  cancelled: { label: "Annulée", color: "bg-red-500/20 text-red-400" },
};

const categoryIcons: Record<string, string> = {
  cleaning: "🧹",
  snow_removal: "❄️",
  moving: "📦",
  handyman: "🔧",
  gardening: "🌿",
  painting: "🎨",
  delivery: "🚚",
  other: "⚡",
};

interface MissionCardProps {
  mission: MissionResponse;
}

export function MissionCard({ mission }: MissionCardProps) {
  const status = statusConfig[mission.status] || statusConfig.open;
  const icon = categoryIcons[mission.category] || "⚡";
  const timeAgo = formatDistanceToNow(new Date(mission.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <Link
      href={`/missions/${mission.id}`}
      className="block rounded-xl border border-white/10 bg-neutral-800/80 backdrop-blur p-4 transition-all hover:border-white/20 hover:bg-neutral-700/80"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm truncate">{mission.title}</h3>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", status.color)}>
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {mission.price}$
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {mission.city}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>

          {mission.distanceKm != null && (
            <p className="text-xs text-red-accent">{mission.distanceKm.toFixed(1)} km</p>
          )}
        </div>
      </div>
    </Link>
  );
}
