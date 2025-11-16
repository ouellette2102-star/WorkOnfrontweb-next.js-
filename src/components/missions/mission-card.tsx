import type { Mission } from "@/types/mission";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type MissionCardProps = {
  mission: Mission;
  onSelect?: (mission: Mission) => void;
};

const statusLabels: Record<string, string> = {
  CREATED: "Créée",
  RESERVED: "Réservée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const statusColors: Record<string, string> = {
  CREATED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  RESERVED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  IN_PROGRESS: "bg-green-500/10 text-green-400 border-green-500/20",
  COMPLETED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function MissionCard({ mission, onSelect }: MissionCardProps) {
  const formattedRate = mission.hourlyRate
    ? `${mission.hourlyRate.toFixed(2)} $/h`
    : mission.priceCents
      ? `${(mission.priceCents / 100).toFixed(2)} $`
      : "Prix à discuter";

  const formattedDate = mission.startsAt
    ? new Date(mission.startsAt).toLocaleDateString("fr-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Date flexible";

  return (
    <Card className="group cursor-pointer border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10">
      <div
        onClick={() => onSelect?.(mission)}
        className="flex flex-col gap-4"
      >
        {/* Header avec statut */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-white group-hover:text-red-400">
            {mission.title}
          </h3>
          <Badge
            className={`${statusColors[mission.status] ?? "bg-gray-500/10 text-gray-400"} shrink-0`}
          >
            {statusLabels[mission.status] ?? mission.status}
          </Badge>
        </div>

        {/* Description */}
        {mission.description && (
          <p className="line-clamp-2 text-sm text-white/70">
            {mission.description}
          </p>
        )}

        {/* Métadonnées */}
        <div className="flex flex-wrap gap-4 text-sm text-white/60">
          {mission.city && (
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span>{mission.city}</span>
            </div>
          )}
          {mission.category && (
            <div className="flex items-center gap-1">
              <span>🏷️</span>
              <span className="capitalize">{mission.category}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span className="font-semibold text-white/90">{formattedRate}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

