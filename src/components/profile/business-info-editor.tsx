"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  Globe,
  Loader2,
  MapPin,
  ReceiptText,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { api, apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Draft = {
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  businessWebsite: string;
  businessAddress: string;
  gstNumber: string;
  qstNumber: string;
};

const BUSINESS_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "nettoyage-residentiel", label: "Nettoyage residentiel" },
  { value: "nettoyage-commercial", label: "Nettoyage commercial" },
  { value: "paysagement", label: "Paysagement" },
  { value: "deneigement", label: "Deneigement" },
  { value: "demenagement", label: "Demenagement" },
  { value: "evenementiel", label: "Montage/demontage & nettoyage d'evenement" },
  { value: "restauration", label: "Services aux restaurants (entretien, hotte, refrigeration)" },
  { value: "autre", label: "Autre" },
];

const fieldLabels: Record<keyof Draft, string> = {
  businessName: "Nom legal",
  businessCategory: "Categorie",
  businessDescription: "Description",
  businessWebsite: "Site web",
  businessAddress: "Adresse legale",
  gstNumber: "TPS",
  qstNumber: "TVQ",
};

function toDraft(src: Partial<Record<keyof Draft, unknown>>): Draft {
  const str = (v: unknown): string =>
    typeof v === "string" ? v : v == null ? "" : String(v);
  return {
    businessName: str(src.businessName),
    businessCategory: str(src.businessCategory),
    businessDescription: str(src.businessDescription),
    businessWebsite: str(src.businessWebsite),
    businessAddress: str(src.businessAddress),
    gstNumber: str(src.gstNumber),
    qstNumber: str(src.qstNumber),
  };
}

function isDirty(a: Draft, b: Draft): boolean {
  return (Object.keys(a) as Array<keyof Draft>).some((key) => a[key] !== b[key]);
}

function validateTaxNumber(value: string, kind: "gst" | "qst"): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^[0-9A-Z]{12,20}$/.test(v.toUpperCase())) {
    return kind === "gst"
      ? "Format attendu : 9 chiffres + RT0001"
      : "Format attendu : 10 chiffres + TQ0001";
  }
  return null;
}

function validateWebsite(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  try {
    const url = new URL(v);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "Utilise une URL http ou https";
    }
    return null;
  } catch {
    return "Inclue l'adresse complete, ex. https://exemple.ca";
  }
}

function present(value: string): boolean {
  return Boolean(value.trim());
}

export function BusinessInfoEditor() {
  const qc = useQueryClient();
  const { refreshUser } = useAuth();
  const [draftOverride, setDraftOverride] = useState<Draft | null>(null);

  const { data: me, isLoading } = useQuery({
    queryKey: ["me-business-info"],
    queryFn: () =>
      apiFetch<Partial<Record<keyof Draft, string | null>>>("/users/me"),
  });

  const initial = useMemo(() => (me ? toDraft(me) : null), [me]);
  const draft = draftOverride ?? initial;

  const websiteError = draft ? validateWebsite(draft.businessWebsite) : null;
  const gstError = draft ? validateTaxNumber(draft.gstNumber, "gst") : null;
  const qstError = draft ? validateTaxNumber(draft.qstNumber, "qst") : null;

  const publicFields = draft
    ? [
        draft.businessName,
        draft.businessCategory,
        draft.businessDescription,
        draft.businessWebsite,
      ]
    : [];
  const publicComplete = publicFields.filter(present).length;
  const invoiceReady =
    Boolean(draft?.businessName.trim()) && Boolean(draft?.businessAddress.trim());

  const mutation = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("No draft");
      return api.updateProfile({
        businessName: draft.businessName.trim() || undefined,
        businessCategory: draft.businessCategory.trim() || undefined,
        businessDescription: draft.businessDescription.trim() || undefined,
        businessWebsite: draft.businessWebsite.trim() || undefined,
        businessAddress: draft.businessAddress.trim() || undefined,
        gstNumber: draft.gstNumber.trim().toUpperCase() || undefined,
        qstNumber: draft.qstNumber.trim().toUpperCase() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Dossier de cie enregistre");
      qc.invalidateQueries({ queryKey: ["me-business-info"] });
      qc.invalidateQueries({ queryKey: ["me-profile-raw"] });
      qc.invalidateQueries({ queryKey: ["me-profile"] });
      qc.invalidateQueries({ queryKey: ["verification-status"] });
      setDraftOverride(null);
      try {
        await refreshUser();
      } catch {
        // The saved data remains canonical; the next auth refresh will catch up.
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[business-info-editor] save failed:", err);
      toast.error(`Impossible d'enregistrer le dossier de cie : ${message}`);
    },
  });

  if (isLoading || !draft || !initial) {
    return (
      <section className="rounded-[28px] border border-workon-border bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
        </div>
      </section>
    );
  }

  const canSave =
    isDirty(draft, initial) &&
    !websiteError &&
    !gstError &&
    !qstError &&
    !mutation.isPending;
  const missingPublic = ([
    "businessName",
    "businessCategory",
    "businessDescription",
    "businessWebsite",
  ] as Array<keyof Draft>).filter((key) => !present(draft[key]));
  const currentDraft = draft;

  function updateField(key: keyof Draft, value: string) {
    setDraftOverride((current): Draft => {
      const base = current ?? currentDraft;
      return {
        businessName: base.businessName,
        businessCategory: base.businessCategory,
        businessDescription: base.businessDescription,
        businessWebsite: base.businessWebsite,
        businessAddress: base.businessAddress,
        gstNumber: base.gstNumber,
        qstNumber: base.qstNumber,
        [key]: value,
      };
    });
  }

  return (
    <section
      className="overflow-hidden rounded-[28px] border border-workon-border bg-white shadow-sm"
      data-testid="business-info-editor"
    >
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.35fr]">
        <aside className="bg-workon-ink p-5 text-white md:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
            <Building2 className="h-3.5 w-3.5 text-workon-gold" />
            Dossier de cie
          </div>
          <h2 className="mt-4 font-heading text-3xl font-black tracking-tight">
            Infos de cie et facturation
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Ce bloc alimente la confiance du profil, les rappels du centre de
            confiance et les informations legales reprises sur les factures.
          </p>

          <div className="mt-6 grid gap-3">
            <StatusTile
              icon={ShieldCheck}
              label="Signal confiance"
              value={`${publicComplete}/4`}
              detail={
                missingPublic.length === 0
                  ? "Profil de cie complet"
                  : `${missingPublic.length} champ${missingPublic.length > 1 ? "s" : ""} a completer`
              }
              complete={missingPublic.length === 0}
            />
            <StatusTile
              icon={ReceiptText}
              label="Factures"
              value={invoiceReady ? "Pretes" : "A completer"}
              detail={
                invoiceReady
                  ? "Nom legal et adresse presents"
                  : "Nom legal et adresse requis pour un dossier propre"
              }
              complete={invoiceReady}
            />
            <StatusTile
              icon={FileText}
              label="TPS / TVQ"
              value={
                draft.gstNumber || draft.qstNumber ? "Renseignees" : "Optionnel"
              }
              detail="A remplir seulement si la cie est inscrite aux taxes."
              complete={!gstError && !qstError}
            />
          </div>
        </aside>

        <div className="space-y-6 p-5 md:p-7">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-workon-stone">
              Profil public de la cie
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextField
                id="businessName"
                label="Nom legal de l'entreprise"
                value={draft.businessName}
                placeholder="Ex. Nettoyage Pro Montreal inc."
                maxLength={120}
                icon={Building2}
                onChange={(value) => updateField("businessName", value)}
              />
              <CategoryField
                value={draft.businessCategory}
                onChange={(value) => updateField("businessCategory", value)}
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
              <TextAreaField
                id="businessDescription"
                label="Description de la cie"
                value={draft.businessDescription}
                placeholder="Secteur desservi, clientele type, specialites, garanties..."
                maxLength={1000}
                onChange={(value) => updateField("businessDescription", value)}
              />
              <TextField
                id="businessWebsite"
                label="Site web"
                value={draft.businessWebsite}
                placeholder="https://exemple.ca"
                maxLength={200}
                icon={Globe}
                error={websiteError}
                onChange={(value) => updateField("businessWebsite", value)}
              />
            </div>
          </div>

          <div className="border-t border-workon-border pt-6">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-workon-stone">
              Facturation legale
            </p>
            <div className="mt-4 grid gap-4">
              <TextField
                id="businessAddress"
                label="Adresse legale"
                value={draft.businessAddress}
                placeholder="1234 rue Saint-Laurent, Montreal, QC H2X 2S6"
                maxLength={200}
                icon={MapPin}
                onChange={(value) => updateField("businessAddress", value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="gstNumber"
                  label="Numero TPS / GST"
                  value={draft.gstNumber}
                  placeholder="123456789RT0001"
                  maxLength={32}
                  icon={ReceiptText}
                  error={gstError}
                  onChange={(value) => updateField("gstNumber", value)}
                />
                <TextField
                  id="qstNumber"
                  label="Numero TVQ / QST"
                  value={draft.qstNumber}
                  placeholder="1234567890TQ0001"
                  maxLength={32}
                  icon={ReceiptText}
                  error={qstError}
                  onChange={(value) => updateField("qstNumber", value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-workon-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-workon-muted">
              Champs suivis par le centre de confiance :{" "}
              {missingPublic.length === 0
                ? "tout est rempli."
                : missingPublic.map((key) => fieldLabels[key]).join(", ")}
            </p>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!canSave}
              data-testid="business-info-save"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-workon-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-workon-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mutation.isPending
                ? "Enregistrement..."
                : isDirty(draft, initial)
                  ? "Enregistrer le dossier"
                  : "Dossier enregistre"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
  detail,
  complete,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  detail: string;
  complete: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            complete ? "bg-emerald-400/15 text-emerald-100" : "bg-amber-300/15 text-amber-100",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
            {label}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-lg font-black">
            {value}
            {complete ? <CheckCircle2 className="h-4 w-4 text-emerald-200" /> : null}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-white/62">
            {detail}
          </span>
        </span>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  error,
  icon: Icon,
}: {
  id: keyof Draft;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string | null;
  icon: typeof Briefcase;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-workon-ink">
        {label}
      </label>
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-workon-stone" />
        <input
          id={id}
          data-testid={`business-info-${id}`}
          type={id === "businessWebsite" ? "url" : "text"}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-11 w-full rounded-2xl border bg-white pl-10 pr-3 text-sm text-workon-ink placeholder:text-workon-muted focus:outline-none focus:ring-2",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-workon-border focus:border-workon-primary focus:ring-workon-primary/25",
          )}
        />
      </div>
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CategoryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedLabel =
    BUSINESS_CATEGORIES.find((category) => category.value === value)?.label ??
    "Choisir";

  return (
    <div>
      <label htmlFor="businessCategory" className="text-sm font-bold text-workon-ink">
        Categorie principale
      </label>
      <div className="relative mt-2">
        <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-workon-stone" />
        <select
          id="businessCategory"
          data-testid="business-info-businessCategory"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-2xl border border-workon-border bg-white pl-10 pr-9 text-sm font-semibold text-workon-ink focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/25"
          aria-label={`Categorie principale : ${selectedLabel}`}
        >
          <option value="">Choisir une categorie</option>
          {BUSINESS_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  id: keyof Draft;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold text-workon-ink">
          {label}
        </label>
        {maxLength ? (
          <span className="text-[11px] font-semibold text-workon-muted">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        id={id}
        data-testid={`business-info-${id}`}
        value={value}
        rows={5}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-2xl border border-workon-border bg-white px-3 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/25"
      />
    </div>
  );
}
