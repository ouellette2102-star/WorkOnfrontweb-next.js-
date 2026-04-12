"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type MissionPhoto } from "@/lib/api-client";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface MissionPhotosProps {
  missionId: string;
  canEdit?: boolean;
}

export function MissionPhotos({ missionId, canEdit = false }: MissionPhotosProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const { data: photos, isLoading } = useQuery({
    queryKey: ["mission-photos", missionId],
    queryFn: async () => {
      const list = await api.getMissionPhotos(missionId);
      // Fetch signed URLs for each photo
      const urls: Record<string, string> = {};
      await Promise.all(
        list.map(async (photo) => {
          try {
            const { url } = await api.getMissionPhotoUrl(missionId, photo.id);
            urls[photo.id] = url;
          } catch {
            // If signed URL fails, try the direct url field
            if (photo.url) urls[photo.id] = photo.url;
          }
        }),
      );
      setPhotoUrls(urls);
      return list;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadMissionPhoto(missionId, file),
    onSuccess: () => {
      toast.success("Photo ajoutee !");
      queryClient.invalidateQueries({ queryKey: ["mission-photos", missionId] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => api.deleteMissionPhoto(missionId, photoId),
    onSuccess: () => {
      toast.success("Photo supprimee");
      queryClient.invalidateQueries({ queryKey: ["mission-photos", missionId] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression"),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptees");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La photo ne doit pas depasser 10 Mo");
      return;
    }

    uploadMutation.mutate(file);
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const hasPhotos = photos && photos.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-workon-muted" />
      </div>
    );
  }

  if (!hasPhotos && !canEdit) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-workon-ink flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-workon-primary" />
        Photos
        {hasPhotos && (
          <span className="text-xs font-normal text-workon-muted">
            ({photos.length})
          </span>
        )}
      </h2>

      {/* Photo grid */}
      {hasPhotos && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo: MissionPhoto) => (
            <div
              key={photo.id}
              className="relative rounded-2xl overflow-hidden border border-workon-border aspect-square group"
            >
              {photoUrls[photo.id] ? (
                <Image
                  src={photoUrls[photo.id]}
                  alt="Photo de mission"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-workon-bg">
                  <ImageIcon className="h-8 w-8 text-workon-muted" />
                </div>
              )}

              {/* Delete button */}
              {canEdit && (
                <button
                  onClick={() => deleteMutation.mutate(photo.id)}
                  disabled={deleteMutation.isPending}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700"
                  aria-label="Supprimer la photo"
                >
                  {deleteMutation.isPending &&
                  deleteMutation.variables === photo.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canEdit && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="w-full border-2 border-dashed border-workon-primary/30 bg-workon-primary/5 rounded-2xl p-8 text-center hover:border-workon-primary/50 hover:bg-workon-primary/10 transition-colors cursor-pointer"
          >
            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
                <span className="text-sm text-workon-muted">
                  Envoi en cours...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-workon-primary/60" />
                <span className="text-sm font-medium text-workon-ink">
                  Ajouter une photo
                </span>
                <span className="text-xs text-workon-muted">
                  JPG, PNG ou WEBP (max 10 Mo)
                </span>
              </div>
            )}
          </button>
        </>
      )}
    </div>
  );
}
