"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api, apiFetch } from "@/lib/api-client";

/**
 * BusinessInfoEditor — legal information surfaced on every invoice.
 *
 * Revenu Québec IN-203 (Quebec sales tax compliance) requires the
 * supplier's legal name, address and TPS/TVQ registration numbers on
 * any invoice where those taxes are charged. Before this component,
 * the three fields (`businessAddress`, `gstNumber`, `qstNumber`) were
 * present in the Prisma schema and consumed by the invoice snapshot
 * generator, but nothing on the frontend could actually set them —
 * so every invoice produced had empty tax / address lines.
 *
 * Wired to PATCH /users/me using the shared `api.updateProfile`
 * wrapper. Shows for both workers and employers: workers because
 * they're the supplier on escrow payouts, employers because the
 * client snapshot uses `businessName` + `businessAddress`.
 *
 * State model mirrors WorkerCardEditor — hydrate from /users/me,
 * keep an `initial` snapshot for dirty detection, disable save until
 * there is a real diff.
 */

type Draft = {
  businessName: string;
  businessAddress: string;
  gstNumber: string;
  qstNumber: string;
};

function toDraft(src: Partial<Draft> & Record<string, unknown>): Draft {
  const str = (v: unknown): string =>
    typeof v === "string" ? v : v == null ? "" : String(v);
  return {
    businessName: str(src.businessName),
    businessAddress: str(src.businessAddress),
    gstNumber: str(src.gstNumber),
    qstNumber: str(src.qstNumber),
  };
}

function isDirty(a: Draft, b: Draft): boolean {
  return (
    a.businessName !== b.businessName ||
    a.businessAddress !== b.businessAddress ||
    a.gstNumber !== b.gstNumber ||
    a.qstNumber !== b.qstNumber
  );
}

/**
 * Validation matches the BE DTO (`MaxLength(200)` / `MaxLength(32)`)
 * plus a light shape hint for GST/QST so users don't submit obvious
 * typos. The BE is the source of truth; this is only to avoid an
 * unnecessary round-trip.
 */
function validateField(value: string, kind: "gst" | "qst"): string | null {
  const v = value.trim();
  if (!v) return null; // empty is allowed — field is optional
  // 9+ digits followed by program ID (RT/RC/TQ) + 4 digits is the
  // canonical CRA / Revenu Québec format. We accept uppercase letters
  // and digits, 12–20 chars total, to stay forgiving.
  if (!/^[0-9A-Z]{12,20}$/.test(v.toUpperCase())) {
    return kind === "gst"
      ? "Format attendu : 9 chiffres + RT0001 (ex. 123456789RT0001)"
      : "Format attendu : 10 chiffres + TQ0001 (ex. 1234567890TQ0001)";
  }
  return null;
}

export function BusinessInfoEditor() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [initial, setInitial] = useState<Draft | null>(null);

  const { data: me, isLoading } = useQuery({
    queryKey: ["me-business-info"],
    queryFn: () =>
      apiFetch<{
        businessName?: string | null;
        businessAddress?: string | null;
        gstNumber?: string | null;
        qstNumber?: string | null;
      }>("/users/me"),
  });

  useEffect(() => {
    if (me && !draft) {
      const d = toDraft(me as Record<string, unknown>);
      setDraft(d);
      setInitial(d);
    }
  }, [me, draft]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("No draft");
      return api.updateProfile({
        // Empty string -> undefined so we don't overwrite the field
        // with "" (which would make it non-null in the DB but empty).
        businessName: draft.businessName.trim() || undefined,
        businessAddress: draft.businessAddress.trim() || undefined,
        gstNumber: draft.gstNumber.trim().toUpperCase() || undefined,
        qstNumber: draft.qstNumber.trim().toUpperCase() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Infos fiscales enregistrées");
      qc.invalidateQueries({ queryKey: ["me-business-info"] });
      qc.invalidateQueries({ queryKey: ["me-profile-raw"] });
      qc.invalidateQueries({ queryKey: ["me-profile"] });
      if (draft) setInitial(draft);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer les infos fiscales",
      );
    },
  });

  if (isLoading || !draft || !initial) {
    return (
      <section className="rounded-3xl border border-workon-border bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
        </div>
      </section>
    );
  }

  const gstError = validateField(draft.gstNumber, "gst");
  const qstError = validateField(draft.qstNumber, "qst");
  const canSave =
    isDirty(draft, initial) && !gstError && !qstError && !mutation.isPending;

  const missingCount = [
    draft.businessName,
    draft.businessAddress,
    draft.gstNumber,
    draft.qstNumber,
  ].filter((v) => !v.trim()).length;

  return (
    <section
      className="rounded-3xl border border-workon-border bg-white p-8 shadow-sm"
      data-testid="business-info-editor"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-workon-muted">
            Infos fiscales
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Facturation légale</h2>
          <p className="mt-2 max-w-xl text-sm text-workon-muted">
            Ces champs apparaissent sur chaque facture émise via WorkOn
            (Revenu Québec IN-203). Laisse vide si tu n&apos;es pas inscrit
            aux fichiers TPS/TVQ.
          </p>
        </div>
        {missingCount === 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Complet
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
            title="Factures non conformes tant que ces champs sont vides"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {missingCount} champ{missingCount > 1 ? "s" : ""} manquant
            {missingCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4">
        <Field
          id="businessName"
          label="Nom légal de l'entreprise"
          placeholder="Ex. Nettoyage Pro Montréal inc."
          value={draft.businessName}
          maxLength={120}
          onChange={(v) =>
            setDraft((d) => (d ? { ...d, businessName: v } : d))
          }
        />
        <Field
          id="businessAddress"
          label="Adresse légale"
          placeholder="Ex. 1234 rue Saint-Laurent, Montréal, QC H2X 2S6"
          value={draft.businessAddress}
          maxLength={200}
          onChange={(v) =>
            setDraft((d) => (d ? { ...d, businessAddress: v } : d))
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="gstNumber"
            label="Numéro TPS / GST"
            placeholder="123456789RT0001"
            value={draft.gstNumber}
            maxLength={32}
            error={gstError}
            onChange={(v) =>
              setDraft((d) => (d ? { ...d, gstNumber: v } : d))
            }
          />
          <Field
            id="qstNumber"
            label="Numéro TVQ / QST"
            placeholder="1234567890TQ0001"
            value={draft.qstNumber}
            maxLength={32}
            error={qstError}
            onChange={(v) =>
              setDraft((d) => (d ? { ...d, qstNumber: v } : d))
            }
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!canSave}
          data-testid="business-info-save"
          className="inline-flex items-center gap-2 rounded-full bg-workon-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-workon-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer
        </button>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string | null;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-workon-muted"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-workon-ink placeholder:text-workon-muted focus:outline-none focus:ring-2 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : "border-workon-border focus:border-workon-primary focus:ring-workon-primary/30"
        }`}
      />
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
