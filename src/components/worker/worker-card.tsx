"use client";

import Link from "next/link";
import { Star, Shield } from "lucide-react";
import type { WorkerProfile } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface WorkerCardProps {
  worker: WorkerProfile;
  compact?: boolean;
}

export function WorkerCard({ worker, compact }: WorkerCardProps) {
  return (
    <Link
      href={`/worker/${worker.id}`}
      className={cn(
        "block rounded-xl border border-white/10 bg-neutral-800/80 backdrop-blur overflow-hidden transition-all hover:border-white/20 hover:bg-neutral-700/80",
        compact ? "p-3" : "p-0",
      )}
    >
      {/* Photo */}
      {!compact && worker.photoUrl && (
        <div className="relative h-48 bg-neutral-700">
          <img
            src={worker.photoUrl}
            alt={worker.fullName || `${worker.firstName} ${worker.lastName}`}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent" />
        </div>
      )}

      <div className={cn("space-y-2", compact ? "" : "p-4")}>
        {/* Name + Rating */}
        <div>
          <h3 className="font-semibold text-base">
            {worker.firstName} {worker.lastName}
          </h3>
          {worker.jobTitle && (
            <p className="text-sm text-white/60">{worker.jobTitle}</p>
          )}
          {worker.city && (
            <p className="text-xs text-white/50">{worker.city}</p>
          )}
        </div>

        {/* Stars + completion */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < Math.round(worker.averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white/20",
                )}
              />
            ))}
          </div>
          <span className="text-sm font-medium">{worker.completionPercentage}%</span>
        </div>

        {/* Badges */}
        {worker.badges && worker.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {worker.badges.map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1 rounded-full bg-neutral-700/80 px-2.5 py-0.5 text-xs font-medium text-white/80"
              >
                <Shield className="h-3 w-3 text-red-accent" />
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
