/**
 * Mission time-logs API client.
 *
 * Thin wrapper around `apiFetch` so every time-log call shares the
 * same Bearer auth + auto-refresh on 401 + error normalization as
 * the rest of the app. Backward-compatible exports: call sites still
 * pass a `token` string, but we ignore it — `apiFetch` reads the
 * current token from localStorage. Tokens stay in the signature to
 * avoid touching 4+ consumers in the same PR.
 *
 * See Phase 5 audit §1.3 "parallel api layers" for the consolidation
 * rationale (PR #93).
 */

import { apiFetch } from "./api-client";
import type { MissionTimeLog } from "@/types/mission-time-log";

/** Récupérer les time logs d'une mission. */
export async function getMissionTimeLogs(
  _token: string,
  missionId: string,
): Promise<MissionTimeLog[]> {
  void _token;
  return apiFetch<MissionTimeLog[]>(`/missions/${missionId}/time-logs`);
}

/** Enregistrer une arrivée (CHECK_IN). */
export async function checkInToMission(
  _token: string,
  missionId: string,
  note?: string,
): Promise<MissionTimeLog> {
  void _token;
  return apiFetch<MissionTimeLog>(
    `/missions/${missionId}/time-logs/check-in`,
    {
      method: "POST",
      body: JSON.stringify({ note }),
    },
  );
}

/** Enregistrer un départ (CHECK_OUT). */
export async function checkOutFromMission(
  _token: string,
  missionId: string,
  note?: string,
): Promise<MissionTimeLog> {
  void _token;
  return apiFetch<MissionTimeLog>(
    `/missions/${missionId}/time-logs/check-out`,
    {
      method: "POST",
      body: JSON.stringify({ note }),
    },
  );
}
