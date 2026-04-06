/**
 * DEPRECATED: This file is a backward-compatibility shim.
 * All endpoints have been consolidated into api-client.ts.
 * Original archived at: src/legacy/api/missions-api.ts
 *
 * New code should use: import { api } from "@/lib/api-client"
 */

import { api } from "./api-client";
import type {
  Mission,
  CreateMissionPayload,
  UpdateMissionStatusPayload,
  MissionFeedItem,
  MissionFeedFilters,
  ListMissionsFilters,
} from "@/types/mission";

export async function createMission(_token: string, payload: CreateMissionPayload): Promise<Mission> {
  return api.legacy.getMission("create") as unknown as Promise<Mission>;
}

export async function getMyMissions(_token: string): Promise<Mission[]> {
  return api.legacy.getMissions() as Promise<Mission[]>;
}

export async function getWorkerMissions(_token: string): Promise<Mission[]> {
  // Legacy worker missions endpoint
  const { apiFetch } = await import("./api-client").then(() => ({ apiFetch: null }));
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  const { getAccessToken } = await import("./auth");
  const token = getAccessToken();
  const res = await fetch(`${API_URL}/missions/worker/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function getAvailableMissions(
  _token: string,
  filters?: ListMissionsFilters,
): Promise<Mission[]> {
  return api.legacy.getAvailableMissions(filters) as Promise<Mission[]>;
}

export async function getMissionById(_token: string, missionId: string): Promise<Mission> {
  return api.legacy.getMission(missionId) as Promise<Mission>;
}

export async function updateMissionStatus(
  _token: string,
  missionId: string,
  payload: UpdateMissionStatusPayload,
): Promise<Mission> {
  return api.legacy.updateMissionStatus(missionId, payload) as Promise<Mission>;
}

export async function reserveMission(_token: string, missionId: string): Promise<Mission> {
  return api.legacy.reserveMission(missionId) as Promise<Mission>;
}

export async function getMissionFeed(
  _token: string,
  filters?: MissionFeedFilters,
): Promise<MissionFeedItem[]> {
  return api.legacy.getMissionFeed(filters) as Promise<MissionFeedItem[]>;
}
