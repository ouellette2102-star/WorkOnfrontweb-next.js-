"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export type ProfileRole = "WORKER" | "EMPLOYER" | "ADMIN" | "CLIENT_RESIDENTIAL";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  primaryRole: ProfileRole;
  isWorker: boolean;
  isEmployer: boolean;
  isClientResidential: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useCurrentProfile() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      if (!token) {
        setError("Token non disponible");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Impossible de charger le profil");
      }

      const data = await response.json();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { profile, loading, error, reload: loadProfile };
}

