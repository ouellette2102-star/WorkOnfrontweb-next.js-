"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Loader2, AlertTriangle, Clock, CheckCircle, XCircle, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN: { label: "Ouvert", color: "bg-red-500/20 text-red-600 border-red-500/30", icon: <AlertTriangle className="h-4 w-4" /> },
  IN_MEDIATION: { label: "En mediation", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30", icon: <Clock className="h-4 w-4" /> },
  RESOLVED: { label: "Resolu", color: "bg-green-500/20 text-green-600 border-green-500/30", icon: <CheckCircle className="h-4 w-4" /> },
  CLOSED: { label: "Ferme", color: "bg-neutral-500/20 text-neutral-600 border-neutral-500/30", icon: <XCircle className="h-4 w-4" /> },
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
        <h2 className="mb-2 text-xl font-bold text-workon-ink">Litige introuvable</h2>
        <p className="text-workon-muted">Ce litige n&apos;existe pas ou vous n&apos;y avez pas acces.</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/home" className="mb-4 inline-flex items-center gap-1 text-sm text-workon-muted hover:text-workon-primary">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-workon-ink">Litige #{dispute.id.slice(0, 8)}</h1>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      {/* Reason & Description */}
      <div className="mb-6 space-y-4 rounded-xl border border-workon-border bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-workon-muted">Raison</label>
          <p className="text-workon-ink">{dispute.reason}</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-workon-muted">Description</label>
          <p className="text-workon-ink/80">{dispute.description}</p>
        </div>
        {dispute.resolution && (
          <div>
            <label className="mb-1 block text-xs font-medium text-workon-muted">Resolution</label>
            <p className="text-green-600">{dispute.resolution}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      {Array.isArray(dispute.timeline) && dispute.timeline.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-workon-ink">Chronologie</h2>
          <div className="space-y-3">
            {dispute.timeline.map((event: unknown, i: number) => {
              const e = event as { action?: string; date?: string; note?: string };
              return (
                <div key={i} className="flex gap-3 rounded-xl border border-workon-border bg-white p-3">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium text-workon-ink">{e.action || "Evenement"}</p>
                    {e.note && <p className="text-xs text-workon-muted">{e.note}</p>}
                    {e.date && <p className="text-xs text-workon-muted">{new Date(e.date).toLocaleDateString("fr-CA")}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidence */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-workon-ink">Preuves</h2>
        {Array.isArray(dispute.evidence) && dispute.evidence.length > 0 ? (
          <div className="space-y-2">
            {dispute.evidence.map((item: unknown, i: number) => {
              const evidence = item as { type?: string; url?: string; description?: string };
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-workon-border bg-white p-3">
                  <FileText className="h-5 w-5 text-workon-muted" />
                  <div className="flex-1">
                    <p className="text-sm text-workon-ink">{evidence.description || `Preuve ${i + 1}`}</p>
                    {evidence.type && <p className="text-xs text-workon-muted">{evidence.type}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-workon-border bg-white p-6 text-center text-sm text-workon-muted">
            Aucune preuve soumise
          </p>
        )}
      </div>

      <p className="text-xs text-workon-muted">
        Ouvert le {new Date(dispute.createdAt).toLocaleDateString("fr-CA")}
      </p>
    </div>
  );
}
