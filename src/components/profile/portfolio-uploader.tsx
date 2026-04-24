"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api, apiFetch } from "@/lib/api-client";

/**
 * PortfolioUploader — worker gallery editor.
 *
 * Wires the frontend to `POST /users/me/gallery` and `DELETE /users/me/gallery`
 * which have existed in the backend (users.controller.ts:165-211) but had no UI.
 * That's the root cause of bug #5: endpoint shipped without a client surface.
 *
 * Backend enforces max 12 photos, 5 MB per file, JPEG/PNG/WebP. We replicate
 * the file-type check on the client only to give immediate feedback; the
 * backend stays the source of truth.
 */

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 12;

export function PortfolioUploader() {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Hydrate from /users/me — the gallery field is on LocalUser.gallery (string[]).
  const { data: me, isLoading } = useQuery({
    queryKey: ["me-gallery"],
    queryFn: () => apiFetch<{ gallery?: string[] }>("/users/me"),
  });
  const gallery = me?.gallery ?? [];

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadGalleryPhoto(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me-gallery"] });
      qc.invalidateQueries({ queryKey: ["featured-workers-public"] });
      toast.success("Photo ajoutée au portfolio");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[portfolio-uploader] upload failed:", err);
      toast.error(`Échec de l'envoi : ${message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (url: string) => api.deleteGalleryPhoto(url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me-gallery"] });
      qc.invalidateQueries({ queryKey: ["featured-workers-public"] });
      toast.success("Photo retirée");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[portfolio-uploader] delete failed:", err);
      toast.error(`Échec du retrait : ${message}`);
    },
  });

  const handleFile = (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Format non supporté (JPEG, PNG ou WebP seulement)");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Photo trop lourde (5 MB max)");
      return;
    }
    if (gallery.length >= MAX_PHOTOS) {
      toast.error(`Portfolio complet (${MAX_PHOTOS} photos max)`);
      return;
    }
    uploadMutation.mutate(file);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so picking the same file twice re-fires change.
    if (fileInput.current) fileInput.current.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <section
      className="rounded-3xl border border-workon-border bg-white p-8 shadow-sm"
      data-testid="portfolio-uploader"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-workon-muted">
            Portfolio
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Tes réalisations</h2>
          <p className="mt-2 max-w-xl text-sm text-workon-muted">
            Jusqu&apos;à {MAX_PHOTOS} photos (JPEG, PNG, WebP — 5 MB max).
            Visibles sur ta carte publique et la page /worker/[id].
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-workon-bg px-3 py-1 text-xs font-semibold text-workon-muted">
          {gallery.length} / {MAX_PHOTOS}
        </span>
      </div>

      {isLoading ? (
        <div className="mt-6 flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {gallery.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl border border-workon-border bg-workon-bg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Réalisation"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => deleteMutation.mutate(url)}
                disabled={deleteMutation.isPending}
                aria-label="Retirer cette photo"
                className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80 disabled:cursor-not-allowed"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {gallery.length < MAX_PHOTOS && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInput.current?.click()}
              className={`group flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 text-center text-xs transition ${
                isDragging
                  ? "border-workon-primary bg-workon-primary/5 text-workon-primary"
                  : "border-workon-border bg-workon-bg text-workon-muted hover:border-workon-primary/50 hover:text-workon-ink"
              } ${uploadMutation.isPending ? "pointer-events-none opacity-60" : ""}`}
              data-testid="portfolio-upload-tile"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ImagePlus className="h-6 w-6" />
              )}
              <span className="font-medium">
                {uploadMutation.isPending ? "Envoi..." : "Ajouter une photo"}
              </span>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onPick}
        className="hidden"
        data-testid="portfolio-file-input"
      />
    </section>
  );
}
