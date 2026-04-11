"use client";

import { Zap, CheckCircle2, MapPin } from "lucide-react";

interface StatsBarProps {
  activeWorkers: number;
  completedMissions: number;
  nearby: number;
}

export function StatsBar({ activeWorkers, completedMissions, nearby }: StatsBarProps) {
  const stats = [
    { icon: Zap, value: activeWorkers.toLocaleString("fr-CA"), label: "Actifs", color: "text-amber-500" },
    { icon: CheckCircle2, value: completedMissions.toLocaleString("fr-CA"), label: "Missions", color: "text-workon-primary" },
    { icon: MapPin, value: nearby.toLocaleString("fr-CA"), label: "À proximité", color: "text-workon-accent" },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-workon-border px-4 py-2 shadow-sm"
        >
          <s.icon className={`h-4 w-4 ${s.color}`} />
          <span className="font-bold text-sm text-workon-ink">{s.value}</span>
          <span className="text-workon-muted text-xs">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
