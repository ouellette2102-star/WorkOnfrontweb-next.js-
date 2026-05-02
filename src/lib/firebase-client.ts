"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from "firebase/messaging";

/**
 * Firebase Web SDK initialization for browser push notifications.
 *
 * Configuration is read from NEXT_PUBLIC_FIREBASE_* env vars (set
 * in Vercel project settings — these are public by design, the
 * private side is the Admin SDK on the BE).
 *
 * Use `requestFcmToken()` to obtain a token after the user grants
 * Notification permission. The token is then POSTed to /devices so
 * the BE can target this browser via FCM.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

function isConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      VAPID_KEY,
  );
}

let appCache: FirebaseApp | null = null;
function getFirebaseApp(): FirebaseApp | null {
  if (!isConfigured()) return null;
  if (appCache) return appCache;
  appCache = getApps().length === 0 ? initializeApp(firebaseConfig as never) : getApp();
  return appCache;
}

let messagingCache: Messaging | null = null;
async function getMessagingSafe(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app) return null;
  if (messagingCache) return messagingCache;
  try {
    const supported = await isSupported();
    if (!supported) return null;
  } catch {
    return null;
  }
  messagingCache = getMessaging(app);
  return messagingCache;
}

/**
 * Request the browser's notification permission and resolve the FCM
 * token. Returns null when:
 *   - Firebase is not configured (NEXT_PUBLIC_FIREBASE_* missing)
 *   - the browser doesn't support web push (Safari < 16, in-app
 *     webviews, private mode in some browsers)
 *   - the user denies the permission prompt
 *   - the service worker registration fails
 *
 * Caller is expected to handle null gracefully (no push, only in-app).
 */
export async function requestFcmToken(): Promise<string | null> {
  try {
    const messaging = await getMessagingSafe();
    if (!messaging) return null;

    if (typeof Notification === "undefined") return null;
    const current = Notification.permission;
    const permission =
      current === "granted"
        ? "granted"
        : current === "denied"
          ? "denied"
          : await Notification.requestPermission();
    if (permission !== "granted") return null;

    // Service worker is served from /firebase-messaging-sw.js (see public/).
    // Pass config via query string — service workers can't read
    // NEXT_PUBLIC_* env vars at runtime, so we hand them the same
    // values the page is using.
    const swUrl = new URL("/firebase-messaging-sw.js", window.location.origin);
    swUrl.searchParams.set("apiKey", firebaseConfig.apiKey ?? "");
    swUrl.searchParams.set("authDomain", firebaseConfig.authDomain ?? "");
    swUrl.searchParams.set("projectId", firebaseConfig.projectId ?? "");
    swUrl.searchParams.set(
      "messagingSenderId",
      firebaseConfig.messagingSenderId ?? "",
    );
    swUrl.searchParams.set("appId", firebaseConfig.appId ?? "");

    const registration = await navigator.serviceWorker.register(
      swUrl.toString(),
    );

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[firebase-client] requestFcmToken failed", err);
    }
    return null;
  }
}

/**
 * Subscribe to foreground push messages so the in-tab UI can
 * surface them (e.g. toast). The system tray notification is
 * already handled by the service worker.
 */
export async function onForegroundMessage(
  handler: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void,
): Promise<() => void> {
  const messaging = await getMessagingSafe();
  if (!messaging) return () => undefined;
  return onMessage(messaging, (payload) => {
    handler({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data,
    });
  });
}
