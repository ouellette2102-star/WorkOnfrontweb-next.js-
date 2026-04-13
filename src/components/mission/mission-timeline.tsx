"use client";

import {
  PlusCircle,
  UserCheck,
  Play,
  CheckCircle2,
  CreditCard,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionTimelineProps {
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedToUserId: string | null;
}

const STEPS = [
  { key: "open", label: "Créée", icon: PlusCircle, color: "text-workon-primary" },
  { key: "assigned", label: "Acceptée", icon: UserCheck, color: "text-amber-500" },
  { key: "in_progress", label: "En cours", icon: Play, color: "text-blue-500" },
  { key: "completed", label: "Complétée", icon: CheckCircle2, color: "text-purple-500" },
  { key: "paid", label: "Payée", icon: CreditCard, color: "text-green-600" },
];

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  assigned: 1,
  in_progress: 2,
  completed: 3,
  paid: 4,
  cancelled: -1,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeBetween(start: string, end: string) {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h${remMins}` : `${hours}h`;
}

export function MissionTimeline({
  status,
  createdAt,
  updatedAt,
  assignedToUserId,
}: MissionTimelineProps) {
  const currentIndex = STATUS_ORDER[status] ?? -1;
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-3">
        <XCircle className="h-5 w-5 text-gray-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-500">Mission annulée</p>
          <p className="text-[10px] text-gray-400">{formatDate(updatedAt)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-workon-border bg-white p-4">
      <h3 className="text-xs font-semibold text-workon-muted uppercase tracking-wider mb-3">
        Historique
      </h3>
      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const isPast = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const isNext = i === currentIndex + 1;
          const isLast = i === STEPS.length - 1;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex gap-3">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isPast
                      ? `${step.color} border-current bg-current/10`
                      : "border-workon-border bg-workon-bg text-workon-muted/40"
                  )}
                >
                  {isPast ? (
                    <Icon className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 h-6",
                      isPast && !isCurrent ? "bg-workon-primary/30" : "bg-workon-border"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className={cn("pb-4", !isLast && "")}>
                <p
                  className={cn(
                    "text-sm font-medium leading-7",
                    isPast ? "text-workon-ink" : "text-workon-muted/50"
                  )}
                >
                  {step.label}
                  {isCurrent && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-workon-primary/10 px-2 py-0.5 text-[10px] font-semibold text-workon-primary">
                      actuel
                    </span>
                  )}
                  {isNext && (
                    <span className="ml-2 text-[10px] text-workon-muted">
                      prochaine étape
                    </span>
                  )}
                </p>
                {i === 0 && isPast && (
                  <p className="text-[10px] text-workon-muted">{formatDate(createdAt)}</p>
                )}
                {isCurrent && i > 0 && (
                  <p className="text-[10px] text-workon-muted">
                    {formatDate(updatedAt)} · {timeBetween(createdAt, updatedAt)} depuis création
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
