"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import type { MissionFeedItem } from "@/types/mission";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  FileCheck2,
  MapPin,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

type Props = {
  missions: MissionFeedItem[];
  onReserve: (missionId: string) => void;
  userLocation: { lat: number; lng: number } | null;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  open: {
    label: "Ouverte",
    className: "bg-workon-primary-subtle text-workon-primary",
  },
  assigned: {
    label: "Assignée",
    className: "bg-workon-gold/18 text-workon-copper",
  },
  in_progress: {
    label: "En cours",
    className: "bg-workon-copper/12 text-workon-copper",
  },
  completed: {
    label: "Terminée",
    className: "bg-workon-trust-green/12 text-workon-trust-green",
  },
  paid: {
    label: "Payée",
    className: "bg-workon-trust-green/12 text-workon-trust-green",
  },
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function statusMeta(status: string) {
  return STATUS_LABELS[status] ?? {
    label: status || "Mission",
    className: "bg-workon-bg text-workon-stone",
  };
}

export function MissionFeedList({ missions, onReserve, userLocation }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {missions.map((mission) => {
        const status = statusMeta(mission.status);

        return (
          <article
            key={mission.id}
            className="group flex min-h-[320px] flex-col overflow-hidden rounded-[24px] border border-workon-border bg-workon-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(27,26,24,0.12)]"
          >
            <div className="border-b border-workon-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${status.className}`}>
                  {status.label}
                </span>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-workon-stone">
                    Budget
                  </p>
                  <p className="text-xl font-black text-workon-primary">
                    {formatMoney(mission.priceCents)}
                  </p>
                </div>
              </div>

              <h2 className="mt-4 line-clamp-2 font-heading text-xl font-black leading-tight text-workon-ink">
                {mission.title}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-workon-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-workon-trust-green" />
                {mission.employerName || "Client WorkOn vérifié"}
              </p>
            </div>

            <div className="flex flex-1 flex-col p-4">
              {mission.description && (
                <p className="line-clamp-3 text-sm leading-6 text-workon-gray">
                  {mission.description}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <MissionSignal
                  icon={MapPin}
                  label={mission.distance !== null ? `${mission.distance} km` : userLocation ? "Distance à confirmer" : "Position requise"}
                  detail={mission.city || "Lieu à préciser"}
                />
                <MissionSignal
                  icon={BriefcaseBusiness}
                  label={mission.category || "Mission locale"}
                  detail="Catégorie"
                />
                <MissionSignal
                  icon={Clock3}
                  label={formatDistanceToNow(new Date(mission.createdAt), {
                    addSuffix: true,
                    locale: frCA,
                  })}
                  detail="Publié"
                />
                <MissionSignal
                  icon={FileCheck2}
                  label="Contrat protégé"
                  detail="Après acceptation"
                />
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  onClick={() => onReserve(mission.id)}
                  className="h-11 flex-1 rounded-2xl bg-workon-primary font-black text-white hover:bg-workon-primary-hover"
                >
                  Réserver
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-2xl border-workon-border bg-white px-4 font-bold text-workon-ink hover:bg-workon-bg-cream"
                >
                  <Link href={`/missions/${mission.id}`}>
                    Détails
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MissionSignal({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof WalletCards;
  label: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border/75 bg-white/75 p-3">
      <Icon className="mb-2 h-4 w-4 text-workon-copper" />
      <p className="line-clamp-1 text-sm font-black text-workon-ink">{label}</p>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-workon-muted">{detail}</p>
    </div>
  );
}
