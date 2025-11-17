"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { MissionPhoto } from "@/types/mission-photo";

type Props = {
  missionId: string;
  onClose: () => void;
};

export function MissionPhotosModal({ missionId, onClose }: Props) {
  const { getToken } = useAuth();
  const [photos, setPhotos] = useState<MissionPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<MissionPhoto | null>(null);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
        
        const response = await fetch(`${API_BASE_URL}/missions/${missionId}/photos`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPhotos(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des photos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, [missionId, getToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Photos de la mission</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-xl bg-neutral-800"
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="mb-4 text-6xl">📸</span>
            <p className="text-lg font-semibold text-white">Aucune photo</p>
            <p className="text-white/60">Aucune photo n'a été uploadée pour cette mission</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-neutral-800 transition hover:border-red-500"
              >
                <img
                  src={photo.url}
                  alt={photo.description || "Photo de mission"}
                  className="h-full w-full object-cover transition group-hover:scale-110"
                />
                {photo.uploadedAt && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white/80">
                      {new Date(photo.uploadedAt).toLocaleDateString("fr-CA")}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Close button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-white/20 text-white hover:bg-neutral-800"
          >
            Fermer
          </Button>
        </div>
      </div>

      {/* Lightbox pour photo sélectionnée */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.description || "Photo de mission"}
            className="max-h-full max-w-full rounded-xl"
          />
          {selectedPhoto.description && (
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-black/80 px-4 py-2 text-white">
              {selectedPhoto.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

