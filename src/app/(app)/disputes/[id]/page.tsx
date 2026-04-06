"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Loader2, AlertTriangle, Clock, CheckCircle, XCircle, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN: { label: "Ouvert", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <AlertTriangle className="h-4 w-4" /> },
  IN_MEDIATION: { label: "En mediation", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="h-4 w-4" /> },
  RESOLVED: { label: "Resolu", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="h-4 w-4" /> },
  CLOSED: { label: "Ferme", color: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30", icon: <XCircle className="h-4 w-4" /> },
};

export default function DisputeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: dispute, isLoading, error } = useQuery({
    queryKey: ["dispute", id],
    queryFn: () => api.getDispute(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h2 className="mb-2 text-xl font-bold text-white">Litige introuvable</h2>
        <p className="text-white/60">Ce litige n&apos;existe pas ou vous n&apos;y avez pas acces.</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/home" className="mb-4 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-white">Litige #{dispute.id.slice(0, 8)}</h1>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      {/* Reason & Description */}
      <div className="mb-6 space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">Raison</label>
          <p className="text-white">{dispute.reason}</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">Description</label>
          <p className="text-white/80">{dispute.description}</p>
        </div>
        {dispute.resolution && (
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">Resolution</label>
            <p className="text-green-400">{dispute.resolution}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      {Array.isArray(dispute.timeline) && dispute.timeline.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Chronologie</h2>
          <div className="space-y-3">
            {dispute.timeline.map((event: unknown, i: number) => {
              const e = event as { action?: string; date?: string; note?: string };
              return (
                <div key={i} className="flex gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium text-white">{e.action || "Evenement"}</p>
                    {e.note && <p className="text-xs text-white/50">{e.note}</p>}
                    {e.date && <p className="text-xs text-white/40">{new Date(e.date).toLocaleDateString("fr-CA")}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidence */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Preuves</h2>
        {Array.isArray(dispute.evidence) && dispute.evidence.length > 0 ? (
          <div className="space-y-2">
            {dispute.evidence.map((item: unknown, i: number) => {
              const evidence = item as { type?: string; url?: string; description?: string };
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <FileText className="h-5 w-5 text-white/50" />
                  <div className="flex-1">
                    <p className="text-sm text-white">{evidence.description || `Preuve ${i + 1}`}</p>
                    {evidence.type && <p className="text-xs text-white/40">{evidence.type}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/50">
            Aucune preuve soumise
          </p>
        )}
      </div>

      <p className="text-xs text-white/40">
        Ouvert le {new Date(dispute.createdAt).toLocaleDateString("fr-CA")}
      </p>
    </div>
  );
}
