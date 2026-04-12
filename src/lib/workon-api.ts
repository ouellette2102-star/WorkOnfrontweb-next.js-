/**
 * DEPRECATED: This file is a backward-compatibility shim.
 * All endpoints have been consolidated into api-client.ts.
 * Original archived at: src/legacy/api/workon-api.ts
 *
 * New code should use: import { api } from "@/lib/api-client"
 */

import { api, type PrimaryRole } from "./api-client";

export type { PrimaryRole };

export type ProfileResponse = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  pictureUrl: string | null;
  primaryRole: PrimaryRole;
  isWorker: boolean;
  isEmployer: boolean;
  isClientResidential: boolean;
};

export type ProfileUpdatePayload = Partial<{
  primaryRole: PrimaryRole;
  fullName: string;
  phone: string;
  city: string;
}>;

export async function fetchProfile(_token: string): Promise<ProfileResponse> {
  return api.fetchProfile() as Promise<ProfileResponse>;
}

export async function saveProfile(
  _token: string,
  payload: ProfileUpdatePayload,
): Promise<ProfileResponse> {
  return api.saveProfile(payload) as Promise<ProfileResponse>;
}
