"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, X, Save, ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, apiFetch } from "@/lib/api-client";

/**
 * WorkerCardEditor — self-service form for the fields that render on
 * the public worker card (home carousel, /worker/[id], /pros/[slug]).
 *
 * Wired to PATCH /users/me (backend DTO extended in workon-backend#252).
 *
 * State model: local form state initialised from /users/me on mount,
 * "dirty" detection against the initial snapshot so the save button
 * disables when nothing changed. Gallery URL list is edit-in-place —
 * no upload here; paste any URL. An S3 uploader is a natural follow-up.
 */

const MAX_GALLERY = 12;

type CardDraft = {
  jobTitle: string;
  hourlyRate: string; // string so empty = null
  bio: string;
  category: string;
  serviceRadiusKm: string;
  gallery: string[];
};

function toDraft(src: Partial<CardDraft> & Record<string, unknown>): CardDraft {
  return {
    jobTitle: (src.jobTitle as string) ?? "",
    hourlyRate:
      src.hourlyRate != null && src.hourlyRate !== ""
        ? String(src.hourlyRate)
        : "",
    bio: (src.bio as string) ?? "",
    category: (src.category as string) ?? "",
    serviceRadiusKm:
      src.serviceRadiusKm != null && src.serviceRadiusKm !== ""
        ? String(src.serviceRadiusKm)
        : "",
    gallery: Array.isArray(src.gallery) ? (src.gallery as string[]) : [],
  };
}

export function WorkerCardEditor() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<CardDraft | null>(null);
  const [initial, setInitial] = useState<CardDraft | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  const { data: me, isLoading } = useQuery({
    queryKey: ["me-profile-raw"],
    queryFn: () =>
      apiFetch<{
        jobTitle?: string | null;
        hourlyRate?: number | null;
        bio?: string | null;
        category?: string | null;
        serviceRadiusKm?: number | null;
        gallery?: string[];
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
        jobTitle: draft.jobTitle || undefined,
        hourlyRate: draft.hourlyRate ? Number(draft.hourlyRate) : undefined,
        bio: draft.bio || undefined,
        category: draft.category || undefined,
        serviceRadiusKm: draft.serviceRadiusKm
          ? Number(draft.serviceRadiusKm)
          : undefined,
        gallery: draft.gallery,
      });
    },
    onSuccess: () => {
      toast.success("Ta card publique est à jour");
      qc.invalidateQueries({ queryKey: ["me-profile"] });
      qc.invalidateQueries({ queryKey: ["featured-workers-public"] });
      if (draft) setInitial(draft);
    },
    onError: (err) => {
      toast.error("Impossible de sauvegarder", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    },
  });

  if (isLoading || !draft) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-workon-muted" />
      </div>
    );
  }

  const isDirty =
    !initial ||
    initial.jobTitle !== draft.jobTitle ||
    initial.hourlyRate !== draft.hourlyRate ||
    initial.bio !== draft.bio ||
    initial.category !== draft.category ||
    initial.serviceRadiusKm !== draft.serviceRadiusKm ||
    JSON.stringify(initial.gallery) !== JSON.stringify(draft.gallery);

  const handleAddPhoto = () => {
    const url = newPhotoUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error("URL invalide");
      return;
    }
    if (draft.gallery.length >= MAX_GALLERY) {
      toast.error(`Max ${MAX_GALLERY} photos dans le portfolio`);
      return;
    }
    if (draft.gallery.includes(url)) {
      toast.info("Photo déjà dans le portfolio");
      return;
    }
    setDraft({ ...draft, gallery: [...draft.gallery, url] });
    setNewPhotoUrl("");
  };

  const handleRemovePhoto = (idx: number) => {
    setDraft({
      ...draft,
      gallery: draft.gallery.filter((_, i) => i !== idx),
    });
  };

  // File-upload path (R3.2) — uses POST /users/me/gallery which saves
  // to the server and returns the updated user so we can reflect the
  // canonical list immediately instead of waiting for the form save.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(file: File) {
    if (!draft) return;
    if (draft.gallery.length >= MAX_GALLERY) {
      toast.error(`Max ${MAX_GALLERY} photos dans le portfolio`);
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Format non supporté (JPEG, PNG, WebP uniquement)");
      return;
    }
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      toast.error("Fichier trop volumineux (max 5 Mo)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await apiFetch<{ gallery?: string[] }>(
        "/users/me/gallery",
        { method: "POST", body: formData },
      );
      if (Array.isArray(updated.gallery)) {
        const nextGallery = updated.gallery as string[];
        setDraft((prev) => (prev ? { ...prev, gallery: nextGallery } : prev));
        toast.success("Photo ajoutée au portfolio");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de l'ajout de la photo",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-3xl border border-workon-border bg-white p-6 md:p-8 shadow-sm space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-workon-muted">
          Ta card publique
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Ce que les clients voient</h2>
        <p className="mt-2 text-sm text-workon-muted">
          Ces champs apparaissent sur ton profil public et dans le carrousel
          &quot;Autour de toi&quot;.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Titre du métier"
          hint="Affiché sous ton nom. Ex: Paysagiste résidentiel"
          value={draft.jobTitle}
          maxLength={80}
          onChange={(jobTitle) => setDraft({ ...draft, jobTitle })}
        />
        <Field
          label="Catégorie principale"
          hint="Slug de catégorie. Ex: paysagement, menage, peinture"
          value={draft.category}
          maxLength={60}
          onChange={(category) => setDraft({ ...draft, category })}
        />
        <NumberField
          label="Tarif horaire ($CAD)"
          hint="Affiché comme &quot;À partir de X $/h&quot;"
          value={draft.hourlyRate}
          placeholder="45"
          onChange={(hourlyRate) => setDraft({ ...draft, hourlyRate })}
        />
        <NumberField
          label="Rayon de service (km)"
          hint="Distance maximale autour de ta ville"
          value={draft.serviceRadiusKm}
          placeholder="25"
          onChange={(serviceRadiusKm) =>
            setDraft({ ...draft, serviceRadiusKm })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-workon-ink">
          Bio publique
        </label>
        <p className="text-xs text-workon-muted mb-1.5">
          Maximum 1000 caractères. Vu sur ta page profil.
        </p>
        <textarea
          value={draft.bio}
          rows={4}
          maxLength={1000}
          onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          className="w-full rounded-xl border border-workon-border bg-white px-3 py-2 text-sm text-workon-ink focus:outline-none focus:ring-2 focus:ring-workon-primary/30 focus:border-workon-primary resize-none"
          placeholder="10 ans d'expérience en aménagement paysager résidentiel…"
        />
        <p className="text-[10px] text-workon-muted text-right mt-1">
          {draft.bio.length}/1000
        </p>
      </div>

      {/* Gallery manager */}
      <div>
        <label className="block text-sm font-medium text-workon-ink">
          Portfolio ({draft.gallery.length}/{MAX_GALLERY})
        </label>
        <p className="text-xs text-workon-muted mb-2">
          Importe une photo depuis ton appareil (JPEG/PNG/WebP, 5 Mo max) ou
          colle une URL existante. Les 3 premières sont affichées sur ta
          card publique.
        </p>

        {draft.gallery.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
            {draft.gallery.map((url, i) => (
              <div key={`${url}-${i}`} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Portfolio ${i + 1}`}
                  className="aspect-square w-full rounded-lg object-cover border border-workon-border"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-workon-accent text-white flex items-center justify-center shadow-sm hover:bg-workon-accent/90"
                  aria-label="Retirer cette photo"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                {i < 3 && (
                  <span className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full bg-white/90 text-workon-ink font-semibold">
                    Carrousel #{i + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {/* File upload path (R3.2) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            data-testid="worker-gallery-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileUpload(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || draft.gallery.length >= MAX_GALLERY}
            data-testid="worker-gallery-upload-button"
            className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-workon-primary text-white text-sm font-medium hover:bg-workon-primary/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Envoi…" : "Importer une photo"}
          </button>

          {/* URL paste path — kept for external hosts */}
          <div className="flex-1 relative">
            <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-workon-muted" />
            <input
              type="url"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPhoto();
                }
              }}
              placeholder="…ou colle une URL"
              className="w-full h-10 rounded-lg border border-workon-border bg-white pl-9 pr-3 text-sm text-workon-ink focus:outline-none focus:ring-2 focus:ring-workon-primary/30 focus:border-workon-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleAddPhoto}
            disabled={
              !newPhotoUrl.trim() || draft.gallery.length >= MAX_GALLERY
            }
            className="flex items-center gap-1.5 h-10 px-4 rounded-lg border border-workon-border bg-white text-sm font-medium text-workon-ink hover:bg-workon-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-workon-border">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!isDirty || mutation.isPending}
          className="flex items-center gap-2 rounded-full bg-workon-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-workon-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Sauvegarder
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  value,
  maxLength,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  maxLength?: number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-workon-ink">{label}</label>
      {hint && <p className="text-xs text-workon-muted mb-1.5">{hint}</p>}
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg border border-workon-border bg-white px-3 text-sm text-workon-ink focus:outline-none focus:ring-2 focus:ring-workon-primary/30 focus:border-workon-primary"
      />
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-workon-ink">{label}</label>
      {hint && <p className="text-xs text-workon-muted mb-1.5">{hint}</p>}
      <input
        type="number"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg border border-workon-border bg-white px-3 text-sm text-workon-ink focus:outline-none focus:ring-2 focus:ring-workon-primary/30 focus:border-workon-primary"
      />
    </div>
  );
}
