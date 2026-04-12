"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Award, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    rating: number;
    ratingCount: number;
    level: number;
    badges: string[];
    completedMissions: number;
    bio?: string | null;
  };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 border-b border-[#EAE6DF] bg-white/95 backdrop-blur">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <h1 className="text-2xl font-bold mb-2">{user.name}</h1>

          <div className="flex items-center gap-2 mb-3">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            <span className="font-semibold">{user.rating.toFixed(1)}</span>
            <span className="text-sm text-[#9C9A96]">
              ({user.ratingCount} avis)
            </span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <Badge variant="secondary">Niveau {user.level}</Badge>
            {user.badges.map((badge) => (
              <Badge key={badge} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-[#706E6A] mb-3">
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>{user.completedMissions} missions</span>
            </div>
            <a
              href="#"
              className="flex items-center gap-1 hover:text-[#1B1A18] transition"
            >
              <FileText className="h-4 w-4" />
              <span>CV PDF</span>
            </a>
          </div>

          {user.bio && (
            <p className="text-sm text-[#706E6A] max-w-md">{user.bio}</p>
          )}
        </div>
      </div>
    </header>
  );
}

