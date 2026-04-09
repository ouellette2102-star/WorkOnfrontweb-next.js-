"use client";

import { Zap, CheckCircle2, MapPin } from "lucide-react";

interface StatsBarProps {
  activeWorkers: number;
  completedMissions: number;
  nearby: number;
}

export function StatsBar({ activeWorkers, completedMissions, nearby }: StatsBarProps) {
  const stats = [
    { icon: Zap, value: activeWorkers.toLocaleString("fr-CA"), label: "Actifs", color: "text-yellow-300" },
    { icon: CheckCircle2, value: completedMissions.toLocaleString("fr-CA"), label: "Missions", color: "text-[#22C55E]" },
    { icon: MapPin, value: nearby.toLocaleString("fr-CA"), label: "À proximité", color: "text-[#FF4D1C]" },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 rounded-full bg-neutral-800/80 backdrop-blur border border-white/10 px-4 py-2"
        >
          <s.icon className={`h-4 w-4 ${s.color}`} />
          <span className="font-bold text-sm">{s.value}</span>
          <span className="text-white/50 text-xs">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
