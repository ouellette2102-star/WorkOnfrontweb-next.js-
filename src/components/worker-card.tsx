import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface WorkerCardProps {
  worker: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    rating: number;
    ratingCount: number;
    level: number;
    hourlyRate: number;
  };
}

export function WorkerCard({ worker }: WorkerCardProps) {
  const initials = worker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/profile/${worker.id}`}>
      <Card className="w-64 hover:border-red-500/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={worker.avatarUrl || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{worker.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-medium">
                  {worker.rating.toFixed(1)}
                </span>
                <span className="text-xs text-white/50">
                  ({worker.ratingCount})
                </span>
              </div>
              <div className="mt-2">
                <span className="text-xs text-white/50">Niveau {worker.level}</span>
                <div className="mt-1">
                  <span className="text-sm font-semibold text-red-500">
                    ${worker.hourlyRate.toFixed(2)}/h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

