"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  getMissionPhotos,
  uploadMissionPhoto,
  deleteMissionPhoto,
} from "@/lib/mission-photos-api";
import type { Mission } from "@/types/mission";
import type { MissionPhoto } from "@/types/mission-photo";
import { format } from "date-fns";
import { frCA } from "date-fns/locale";
import { MissionStatus } from "@/types/mission";
import Image from "next/image";

type MissionPhotosProps = {
  mission: Mission;
};

export function MissionPhotos({ mission }: MissionPhotosProps) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [photos, setPhotos] = useState<MissionPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<MissionPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isWorkerAssigned = mission.workerId === user?.id;
  const isEmployerOwner = mission.employerId === user?.id;
  const canUpload = isWorkerAssigned || isEmployerOwner;

  const loadPhotos = useCallback(async () => {
    if (authLoading || !isAuthenticated) return;

    try {
      setIsLoading(true);
      const token = getAccessToken();
      if (!token) {
        setError("Token d'authentification introuvable");
        return;
      }
      const fetchedPhotos = await getMissionPhotos(mission.id, token);
      setPhotos(fetchedPhotos);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des photos"
      );
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, mission.id]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image valide");
      return;
    }

    // Vérifier la taille (8MB)
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("La taille du fichier ne doit pas dépasser 8 MB");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const token = getAccessToken();
      if (!token) {
        setError("Token d'authentification introuvable");
        return;
      }
      await uploadMissionPhoto(mission.id, file, token);
      await loadPhotos();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'upload"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette photo ?")) return;

    try {
      const token = getAccessToken();
      if (!token) {
        setError("Token d'authentification introuvable");
        return;
      }
      await deleteMissionPhoto(mission.id, photoId, token);
      await loadPhotos();
      setSelectedPhoto(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression"
      );
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (!isWorkerAssigned && !isEmployerOwner) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#EAE6DF] bg-white p-4 text-[#1B1A18]">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-lg font-semibold">Photos de la mission</h4>
        {canUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              {isUploading ? "Upload en cours..." : "📷 Téléverser une photo"}
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500 bg-red-500/20 p-3 text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-[#706E6A]">Chargement des photos...</p>
      ) : photos.length === 0 ? (
        <p className="text-[#706E6A]">Aucune photo pour le moment.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#EAE6DF] transition hover:border-[#9C9A96]"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="relative aspect-square">
                <Image
                  src={photo.url}
                  alt="Photo de mission"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                <span className="text-sm font-semibold text-white/95">
                  Voir en grand
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de prévisualisation */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-full w-full">
              <Image
                src={selectedPhoto.url}
                alt="Photo de mission"
                width={1200}
                height={800}
                className="h-auto max-h-[80vh] w-auto object-contain"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-sm text-white/90">
                Uploadée le{" "}
                {format(new Date(selectedPhoto.createdAt), "PPP à HH:mm", {
                  locale: frCA,
                })}
              </p>
            </div>
            <div className="absolute right-4 top-4 flex gap-2">
              {(isEmployerOwner || selectedPhoto.userId === user?.id) && (
                <Button
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                >
                  Supprimer
                </Button>
              )}
              <Button
                onClick={() => setSelectedPhoto(null)}
                className="rounded-xl bg-[#EAE6DF] px-4 py-2 text-sm font-semibold text-[#1B1A18] transition hover:bg-[#DDD9D2]"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

