import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { missionStatusLabel } from "@/lib/i18n-labels";

interface MissionCardProps {
  mission: {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    budgetMin: number;
    budgetMax: number;
    priceType: "FIXED" | "HOURLY";
    status: string;
    createdAt: Date;
  };
}

export function MissionCard({ mission }: MissionCardProps) {
  const priceLabel =
    mission.priceType === "FIXED"
      ? `$${mission.budgetMin.toFixed(2)}`
      : `$${mission.budgetMin.toFixed(2)} - $${mission.budgetMax.toFixed(2)}/h`;

  return (
    <Link href={`/dashboard/missions/${mission.id}`}>
      <Card className="hover:border-red-500/50 transition-colors cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{mission.title}</CardTitle>
              <p className="text-sm text-white/50 mt-1">{mission.category}</p>
            </div>
            <span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400">
              {missionStatusLabel(mission.status)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/70 line-clamp-2 mb-4">
            {mission.description}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-white/60 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{mission.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(mission.createdAt), "d MMM", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{priceLabel}</span>
            </div>
          </div>

          <Button className="w-full">Voir détails</Button>
        </CardContent>
      </Card>
    </Link>
  );
}

