"use client";

import { useEffect } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";

const DEVICE_ID_KEY = "workon_device_id";
const REGISTERED_AT_KEY = "workon_device_registered_at";
const REGISTER_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "ssr-noop";
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `web_${crypto.randomUUID()}`
        : `web_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function shouldReregister(): boolean {
  if (typeof window === "undefined") return false;
  const last = window.localStorage.getItem(REGISTERED_AT_KEY);
  if (!last) return true;
  const lastMs = Number.parseInt(last, 10);
  if (!Number.isFinite(lastMs)) return true;
  return Date.now() - lastMs > REGISTER_TTL_MS;
}

/**
 * Registers the current browser as a `web` device for the authenticated
 * user via POST /devices. The record (id + lastSeenAt) lets the backend
 * target push notifications and track active sessions.
 *
 * pushToken stays empty until Firebase Web SDK is wired in — registering
 * the device row first is the prerequisite for that future step (the
 * row's id becomes the FCM token target). Refreshes once per day to
 * keep lastSeenAt fresh without spamming the endpoint.
 */
export function useDeviceRegistration() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (typeof window === "undefined") return;
    if (!shouldReregister()) return;

    const deviceId = getOrCreateDeviceId();
    const appVersion =
      process.env.NEXT_PUBLIC_APP_VERSION ||
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
      "dev";

    api
      .registerDevice({ deviceId, platform: "web", appVersion })
      .then(() => {
        window.localStorage.setItem(REGISTERED_AT_KEY, String(Date.now()));
      })
      .catch((err) => {
        // Non-blocking — silent failure is fine, device push is opt-in.
        if (process.env.NODE_ENV !== "production") {
          console.warn("[device-registration] failed", err);
        }
      });
  }, [isAuthenticated, isLoading]);
}
