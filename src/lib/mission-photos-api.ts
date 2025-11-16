import { auth } from "@clerk/nextjs/server";
import type { MissionPhoto } from "@/types/mission-photo";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Récupérer toutes les photos d'une mission
 */
export async function getMissionPhotos(
  missionId: string
): Promise<MissionPhoto[]> {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error("Token d'authentification introuvable");
  }

  const response = await fetch(
    `${API_BASE_URL}/missions/${missionId}/photos`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Erreur lors de la récupération des photos"
    );
  }

  return response.json();
}

/**
 * Uploader une photo pour une mission
 */
export async function uploadMissionPhoto(
  missionId: string,
  file: File
): Promise<MissionPhoto> {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error("Token d'authentification introuvable");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/missions/${missionId}/photos`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erreur lors de l'upload de la photo");
  }

  return response.json();
}

/**
 * Supprimer une photo d'une mission
 */
export async function deleteMissionPhoto(
  missionId: string,
  photoId: string
): Promise<void> {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error("Token d'authentification introuvable");
  }

  const response = await fetch(
    `${API_BASE_URL}/missions/${missionId}/photos/${photoId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Erreur lors de la suppression de la photo"
    );
  }
}

