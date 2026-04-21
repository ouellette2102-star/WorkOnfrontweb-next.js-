"use client";

import Link from "next/link";
import { MapPin, Clock, DollarSign } from "lucide-react";
import type { MissionResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string }> = {
  open:        { label: "Ouverte",  color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  assigned:    { label: "Assignée", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  in_progress: { label: "En cours", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  completed:   { label: "Terminée", color: "bg-purple-50 text-purple-700 border border-purple-200" },
  paid:        { label: "Payée",    color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  cancelled:   { label: "Annulée",  color: "bg-gray-50 text-gray-400 border border-gray-200" },
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
        "block rounded-2xl border border-workon-border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-workon-primary/30 hover:shadow-md",
        isCancelled && "opacity-60",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-workon-primary/10 flex items-center justify-center text-2xl">
          {icon}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "font-semibold text-[15px] text-workon-ink truncate",
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

          <div className="flex items-center gap-3 text-xs text-workon-muted">
            <span
              className="flex items-center gap-1 font-semibold text-workon-ink"
              title="Prix affiché avant taxes TPS/TVQ (5 % + 9,975 %)"
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              {mission.price}$
              <span className="ml-0.5 text-[9px] font-normal text-workon-muted">
                avant taxes
              </span>
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
            <p className="text-xs font-medium text-workon-accent">
              📍 {mission.distanceKm.toFixed(1)} km
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
