"use client";

import { useMemo } from "react";
import { useProfile } from "@/hooks/use-profile";

export type PrimaryRoleKey =
  | "worker"
  | "employer"
  | "client"
  | "admin"
  | null;

export interface UsePrimaryRoleResult {
  primaryRole: PrimaryRoleKey;
  isLoading: boolean;
  error: Error | null;
  isWorker: boolean;
  isEmployer: boolean;
  isClient: boolean;
}

export function usePrimaryRole(): UsePrimaryRoleResult {
  const { profile, isLoading, error } = useProfile();

  return useMemo<UsePrimaryRoleResult>(() => {
    if (!profile) {
      return {
        primaryRole: null,
        isLoading,
        error: error ? new Error(error) : null,
        isWorker: false,
        isEmployer: false,
        isClient: false,
      };
    }

    let primaryRole: PrimaryRoleKey = null;
    switch (profile.primaryRole) {
      case "WORKER":
        primaryRole = "worker";
        break;
      case "EMPLOYER":
        primaryRole = "employer";
        break;
      case "CLIENT_RESIDENTIAL":
        primaryRole = "client";
        break;
      case "ADMIN":
        primaryRole = "admin";
        break;
      default:
        primaryRole = null;
    }

    return {
      primaryRole,
      isLoading,
      error: error ? new Error(error) : null,
      isWorker: profile.isWorker,
      isEmployer: profile.isEmployer,
      isClient: profile.isClientResidential,
    };
  }, [profile, isLoading, error]);
}

