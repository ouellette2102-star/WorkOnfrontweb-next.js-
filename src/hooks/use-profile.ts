"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import type {
  PrimaryRole,
  ProfileResponse,
  ProfileUpdatePayload,
} from "@/lib/workon-api";
import { fetchProfile, saveProfile } from "@/lib/workon-api";

type UseProfileState = {
  profile: ProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  updateRole: (role: PrimaryRole) => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<void>;
  refetch: () => Promise<void>;
};

export function useProfile(): UseProfileState {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const withToken = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      throw new Error("Utilisateur non authentifié");
    }
    const token = await getToken();
    if (!token) {
      throw new Error("Impossible de récupérer le token Clerk");
    }
    return token;
  }, [getToken, isLoaded, isSignedIn]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await withToken();
      const data = await fetchProfile(token);
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setIsLoading(false);
    }
  }, [withToken]);

  const mutateProfile = useCallback(
    async (payload: ProfileUpdatePayload) => {
      const token = await withToken();
      const data = await saveProfile(token, payload);
      setProfile(data);
      setError(null);
      return data;
    },
    [withToken],
  );

  const updateRole = useCallback(
    async (role: PrimaryRole) => {
      try {
        await mutateProfile({ primaryRole: role });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de mettre à jour le rôle",
        );
        throw err;
      }
    },
    [mutateProfile],
  );

  const updateProfile = useCallback(
    async (payload: ProfileUpdatePayload) => {
      try {
        await mutateProfile(payload);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de mettre à jour le profil",
        );
        throw err;
      }
    },
    [mutateProfile],
  );

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadProfile();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
      setProfile(null);
    }
  }, [isLoaded, isSignedIn, loadProfile]);

  return {
    profile,
    isLoading,
    error,
    updateRole,
    updateProfile,
    refetch: loadProfile,
  };
}