/**
 * Mission photos API client.
 *
 * Thin wrapper around `apiFetch` so every mission-photo call shares the
 * same Bearer auth + auto-refresh on 401 + error normalization as the
 * rest of the app. Backward-compatible exports: call sites still pass
 * a `token` string, but we ignore it — `apiFetch` reads the current
 * token from localStorage. Tokens passed here are kept in the
 * signature for now to avoid touching 7+ consumers in the same PR.
 *
 * See Phase 5 audit §1.3 "parallel api layers" for the consolidation
 * rationale (PR #93).
 */

import { apiFetch } from "./api-client";
import type { MissionPhoto } from "@/types/mission-photo";

/** Récupérer toutes les photos d'une mission. */
export async function getMissionPhotos(
  missionId: string,
  _token?: string,
): Promise<MissionPhoto[]> {
  void _token;
  return apiFetch<MissionPhoto[]>(`/missions/${missionId}/photos`);
}

/** Uploader une photo pour une mission. */
export async function uploadMissionPhoto(
  missionId: string,
  file: File,
  _token?: string,
): Promise<MissionPhoto> {
  void _token;
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<MissionPhoto>(`/missions/${missionId}/photos`, {
    method: "POST",
    body: formData,
  });
}

/** Supprimer une photo d'une mission. */
export async function deleteMissionPhoto(
  missionId: string,
  photoId: string,
  _token?: string,
): Promise<void> {
  void _token;
  await apiFetch<void>(`/missions/${missionId}/photos/${photoId}`, {
    method: "DELETE",
  });
}
