"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ArrowLeft,
  Plus,
  Send,
  Gavel,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  OPEN: {
    label: "Ouvert",
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  IN_MEDIATION: {
    label: "En médiation",
    color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    icon: <Clock className="h-4 w-4" />,
  },
  RESOLVED: {
    label: "Résolu",
    color: "bg-green-500/20 text-green-600 border-green-500/30",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  CLOSED: {
    label: "Fermé",
    color: "bg-neutral-500/20 text-neutral-600 border-neutral-500/30",
    icon: <XCircle className="h-4 w-4" />,
  },
};

const EVIDENCE_TYPES = [
  { value: "text", label: "Note / Texte" },
  { value: "photo", label: "Photo" },
  { value: "document", label: "Document" },
];

type EvidenceItem = {
  type?: string;
  url?: string;
  description?: string;
  content?: string;
};

export default function DisputeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const {
    data: dispute,
    isLoading,
    error,
  } = useQuery({
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
        <h2 className="mb-2 text-xl font-bold text-workon-ink">
          Litige introuvable
        </h2>
        <p className="text-workon-muted">
          Ce litige n&apos;existe pas ou vous n&apos;y avez pas accès.
        </p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;
  const isOpen = dispute.status === "OPEN" || dispute.status === "IN_MEDIATION";

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["dispute", id] });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/disputes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-workon-muted hover:text-workon-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux litiges
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-workon-ink">
          Litige #{dispute.id.slice(0, 8)}
        </h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusConfig.color}`}
          data-testid="dispute-status-badge"
          data-status={dispute.status}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      <div className="mb-6 space-y-4 rounded-xl border border-workon-border bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-workon-muted">
            Raison
          </label>
          <p className="text-workon-ink">{dispute.reason}</p>
        </div>
        {dispute.description && (
          <div>
            <label className="mb-1 block text-xs font-medium text-workon-muted">
              Description
            </label>
            <p className="text-workon-ink/80">{dispute.description}</p>
          </div>
        )}
        {dispute.resolution && (
          <div>
            <label className="mb-1 block text-xs font-medium text-workon-muted">
              Résolution
            </label>
            <p className="text-green-600">{dispute.resolution}</p>
          </div>
        )}
      </div>

      {Array.isArray(dispute.timeline) && dispute.timeline.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-workon-ink">
            Chronologie
          </h2>
          <div className="space-y-3">
            {dispute.timeline.map((event: unknown, i: number) => {
              const e = event as {
                action?: string;
                createdAt?: string;
                date?: string;
                details?: string;
                note?: string;
              };
              return (
                <div
                  key={i}
                  className="flex gap-3 rounded-xl border border-workon-border bg-white p-3"
                >
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium text-workon-ink">
                      {e.action || "Événement"}
                    </p>
                    {(e.details || e.note) && (
                      <p className="text-xs text-workon-muted">
                        {e.details || e.note}
                      </p>
                    )}
                    {(e.createdAt || e.date) && (
                      <p className="text-xs text-workon-muted">
                        {new Date(
                          (e.createdAt || e.date) as string,
                        ).toLocaleString("fr-CA")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <EvidenceSection
        disputeId={id}
        evidence={(dispute.evidence as EvidenceItem[]) || []}
        canAdd={isOpen}
        onAdded={invalidate}
      />

      {isOpen && (
        <ResolveSection disputeId={id} onResolved={invalidate} />
      )}

      <p className="mt-4 text-xs text-workon-muted">
        Ouvert le {new Date(dispute.createdAt).toLocaleDateString("fr-CA")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Evidence — list + add form                                         */
/* ------------------------------------------------------------------ */

function EvidenceSection({
  disputeId,
  evidence,
  canAdd,
  onAdded,
}: {
  disputeId: string;
  evidence: EvidenceItem[];
  canAdd: boolean;
  onAdded: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-workon-ink">Preuves</h2>
        {canAdd && !formOpen && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-workon-border bg-white px-3 py-1 text-xs font-medium text-workon-ink hover:border-workon-primary hover:text-workon-primary"
            data-testid="open-evidence-form"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        )}
      </div>

      {formOpen && (
        <AddEvidenceForm
          disputeId={disputeId}
          onClose={() => setFormOpen(false)}
          onAdded={() => {
            onAdded();
            setFormOpen(false);
          }}
        />
      )}

      {evidence.length > 0 ? (
        <div className="space-y-2">
          {evidence.map((item, i) => (
            <EvidenceRow key={i} evidence={item} index={i} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-workon-border bg-white p-6 text-center text-sm text-workon-muted">
          {canAdd
            ? "Aucune preuve pour l'instant — ajoutez-en une pour étayer votre litige."
            : "Aucune preuve soumise."}
        </p>
      )}
    </div>
  );
}

function EvidenceRow({
  evidence,
  index,
}: {
  evidence: EvidenceItem;
  index: number;
}) {
  const url = evidence.url?.trim();
  const label = evidence.description || evidence.content || `Preuve ${index + 1}`;
  const isImage = useMemo(() => {
    if (!url) return false;
    try {
      const u = new URL(url);
      return /\.(png|jpe?g|gif|webp|avif)$/i.test(u.pathname);
    } catch {
      return false;
    }
  }, [url]);

  return (
    <div
      className="overflow-hidden rounded-xl border border-workon-border bg-white"
      data-testid="evidence-row"
    >
      <div className="flex items-center gap-3 p-3">
        {isImage ? (
          <ImageIcon className="h-5 w-5 shrink-0 text-workon-primary" />
        ) : (
          <FileText className="h-5 w-5 shrink-0 text-workon-muted" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-workon-ink">{label}</p>
          {evidence.type && (
            <p className="text-xs text-workon-muted">{evidence.type}</p>
          )}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full p-1.5 text-workon-muted hover:bg-workon-bg hover:text-workon-primary"
            aria-label="Ouvrir la preuve"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      {isImage && url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt={label}
          loading="lazy"
          className="w-full border-t border-workon-border object-cover"
          style={{ maxHeight: 240 }}
        />
      )}
    </div>
  );
}

function AddEvidenceForm({
  disputeId,
  onClose,
  onAdded,
}: {
  disputeId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [type, setType] = useState(EVIDENCE_TYPES[0].value);
  const [content, setContent] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      api.addDisputeTextEvidence(disputeId, { type, content: content.trim() }),
    onSuccess: () => {
      toast.success("Preuve ajoutée");
      setContent("");
      onAdded();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Impossible d'ajouter la preuve",
      );
    },
  });

  const canSubmit = content.trim().length >= 3 && !submit.isPending;

  return (
    <form
      className="mb-3 space-y-3 rounded-xl border border-workon-primary/40 bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) submit.mutate();
      }}
      data-testid="evidence-form"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-workon-muted">
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-lg border border-workon-border bg-white px-3 py-2 text-sm text-workon-ink focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary-ring"
        >
          {EVIDENCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-workon-muted">
          Décrivez votre preuve
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Ex. le travail n'a pas été livré selon les spécifications de la mission"
          className="w-full resize-none rounded-lg border border-workon-border bg-white px-3 py-2 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary-ring"
          data-testid="evidence-content"
        />
        <p className="mt-1 text-[10px] text-workon-muted">
          {content.trim().length}/2000 caractères
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1.5 text-sm text-workon-muted hover:text-workon-ink"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-full bg-workon-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-workon-primary-hover disabled:opacity-50"
          data-testid="submit-evidence"
        >
          {submit.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Envoyer
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Resolve                                                            */
/* ------------------------------------------------------------------ */

function ResolveSection({
  disputeId,
  onResolved,
}: {
  disputeId: string;
  onResolved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.resolveDispute(disputeId, { resolution: text.trim() }),
    onSuccess: () => {
      toast.success("Litige marqué comme résolu");
      setOpen(false);
      setText("");
      onResolved();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Impossible de résoudre le litige",
      );
    },
  });

  const canSubmit = text.trim().length >= 3 && !mutation.isPending;

  if (!open) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-workon-primary/50 bg-workon-primary/5 px-4 py-2.5 text-sm font-semibold text-workon-primary hover:bg-workon-primary/10"
          data-testid="open-resolve-form"
        >
          <Gavel className="h-4 w-4" />
          Marquer comme résolu
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-2 space-y-3 rounded-xl border border-workon-primary/50 bg-workon-primary/5 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) mutation.mutate();
      }}
      data-testid="resolve-form"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-workon-muted">
          Résolution convenue
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Ex. remboursement partiel de 50 %, travail complété le 22 avril"
          className="w-full resize-none rounded-lg border border-workon-border bg-white px-3 py-2 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary-ring"
          data-testid="resolve-content"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setText("");
          }}
          className="rounded-full px-3 py-1.5 text-sm text-workon-muted hover:text-workon-ink"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-full bg-workon-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-workon-primary-hover disabled:opacity-50"
          data-testid="submit-resolve"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Gavel className="h-4 w-4" />
          )}
          Confirmer la résolution
        </button>
      </div>
    </form>
  );
}
