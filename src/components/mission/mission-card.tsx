"use client";

import Link from "next/link";
import { MapPin, Clock, DollarSign } from "lucide-react";
import type { MissionResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string }> = {
  open:        { label: "Ouverte",  color: "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/25" },
  assigned:    { label: "Assignée", color: "bg-[#FF4D1C]/15 text-[#FF4D1C] border border-[#FF4D1C]/25" },
  in_progress: { label: "En cours", color: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/25" },
  completed:   { label: "Terminée", color: "bg-purple-500/15 text-purple-300 border border-purple-500/25" },
  paid:        { label: "Payée",    color: "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/25" },
  cancelled:   { label: "Annulée",  color: "bg-white/5 text-white/40 border border-white/10" },
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
  const isCancelled = mission.status === "cancelled";

  return (
    <Link
      href={`/missions/${mission.id}`}
      className={cn(
        "block rounded-3xl border border-white/10 bg-neutral-800/80 backdrop-blur-sm p-5 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-[#FF4D1C]/30 hover:shadow-xl hover:shadow-[#FF4D1C]/10",
        isCancelled && "opacity-60",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-[#FF4D1C]/10 border border-[#FF4D1C]/20 flex items-center justify-center text-2xl">
          {icon}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "font-semibold text-[15px] text-white truncate",
                isCancelled && "line-through",
              )}
            >
              {mission.title}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                status.color,
              )}
            >
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="flex items-center gap-1 font-semibold text-white">
              <DollarSign className="h-3.5 w-3.5 text-[#22C55E]" />
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
            <p className="text-xs font-medium text-[#FF4D1C]">
              📍 {mission.distanceKm.toFixed(1)} km
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
