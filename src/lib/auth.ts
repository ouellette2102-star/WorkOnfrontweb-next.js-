/**
 * WorkOn Authentication Client
 *
 * All auth network traffic goes through the same-origin Next.js proxy
 * routes under `/api/auth/*`. The proxies set httpOnly cookies for the
 * server-side gate (middleware + RSC layout) AND return the same tokens
 * in the JSON body so the client can cache them in localStorage for
 * `api-client.ts` (which still calls the backend directly with a Bearer
 * header).
 *
 * Both stores stay in sync. Removing the previous dual-call pattern
 * (proxy then direct cross-origin call) fixes a CORS / SameSite class of
 * bugs that surfaced as "Échec de la connexion" on Vercel previews.
 *
 * All localStorage access goes through `safeLocalStorage` — raw access
 * throws SecurityError/QuotaExceededError inside Messenger/Instagram
 * in-app WebViews and surfaces as the app-wide error boundary.
 */

import { safeLocalStorage } from "@/lib/safe-storage";

const TOKEN_KEY = "workon_access_token";
const REFRESH_KEY = "workon_refresh_token";
const USER_KEY = "workon_user";

export type UserRole = "worker" | "employer" | "residential_client" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  city: string | null;
  pictureUrl: string | null;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // Worker-facing fields (already round-tripped by /users/me since #253)
  jobTitle?: string | null;
  hourlyRate?: number | null;
  bio?: string | null;
  gallery?: string[];
  // Employer onboarding (T44 backend #263) — all nullable pre-migration.
  // `onboardingCompletedAt` gates /missions/new + drives /onboarding/employer.
  businessName?: string | null;
  businessCategory?: string | null;
  businessDescription?: string | null;
  businessWebsite?: string | null;
  onboardingCompletedAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

// --- Token Storage (localStorage cache, mirrored from proxy responses) ---

export function getAccessToken(): string | null {
  return safeLocalStorage.getItem(TOKEN_KEY);
}

export function getRefreshTokenValue(): string | null {
  return safeLocalStorage.getItem(REFRESH_KEY);
}

export function getCachedUser(): AuthUser | null {
  const raw = safeLocalStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

interface ProxyAuthResponse {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

function storeAuth(res: ProxyAuthResponse) {
  if (res.accessToken) {
    safeLocalStorage.setItem(TOKEN_KEY, res.accessToken);
  }
  if (res.refreshToken) {
    safeLocalStorage.setItem(REFRESH_KEY, res.refreshToken);
  }
  safeLocalStorage.setItem(USER_KEY, JSON.stringify(res.user));
}

function clearAuth() {
  safeLocalStorage.removeItem(TOKEN_KEY);
  safeLocalStorage.removeItem(REFRESH_KEY);
  safeLocalStorage.removeItem(USER_KEY);
}

// --- API Calls (all via same-origin proxy routes) ---

export async function login(dto: LoginDto): Promise<{ user: AuthUser }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Échec de la connexion");
  }

  const data: ProxyAuthResponse = await res.json();
  storeAuth(data);
  return { user: data.user };
}

export async function register(dto: RegisterDto): Promise<{ user: AuthUser }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Échec de l'inscription");
  }

  const data: ProxyAuthResponse = await res.json();
  storeAuth(data);
  return { user: data.user };
}

/**
 * Emits a browser CustomEvent on the window when the refresh path
 * fails and the local auth state has been cleared. `AuthProvider`
 * listens for this and surfaces a toast + redirect — we use an
 * event instead of importing `sonner` here to keep `lib/auth.ts`
 * free of React/UI dependencies.
 */
function emitSessionExpired() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("workon:session-expired"));
  } catch (err) {
    console.warn("[auth] could not dispatch session-expired event", err);
  }
}

/**
 * In-flight promise mutex so concurrent 401s share a single refresh
 * call. Without this, each parallel API call that hits 401 fires its
 * own `/api/auth/refresh`. The backend now rotates refresh tokens on
 * every call and blacklists the old one (single-use — security best
 * practice landed in workon-backend #285), so only the **first**
 * parallel refresh succeeds. Every later one receives the same cookie
 * but, on the backend, it has just been invalidated → 401 → the proxy
 * clears the cookies → the user is logged out mid-session.
 *
 * This was easy to reproduce: login, then fire 3 parallel refreshes
 * with the same token — request #1 got 200, #2 and #3 got 401 with
 * `TOKEN_EXPIRED`. That exact scenario hits on every app load because
 * multiple React Query hooks fire at once and each runs its own
 * 401 → refresh retry loop.
 *
 * The fix is a classic in-flight promise: if a refresh is pending,
 * return the same promise to every concurrent caller. Reset once it
 * resolves so the next genuine expiry (later in the session) can
 * refresh again.
 */
let refreshInFlight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      clearAuth();
      emitSessionExpired();
      return null;
    }
    const data = await res.json();
    if (data.accessToken) safeLocalStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken) safeLocalStorage.setItem(REFRESH_KEY, data.refreshToken);
    return data.accessToken ?? null;
  } catch {
    clearAuth();
    emitSessionExpired();
    return null;
  }
}

export async function refreshToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = doRefresh().finally(() => {
    // Release the mutex only after the in-flight refresh settles,
    // so later genuine expiries can trigger a new refresh.
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 401) {
      clearAuth();
      return null;
    }
    if (!res.ok) return null;
    const user = await res.json();
    safeLocalStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}

export function logout() {
  clearAuth();
  // Fire-and-forget proxy call to clear httpOnly cookies server-side.
  // The local clearAuth() above is what the UI actually relies on, so we
  // don't block logout on this — but surface failures in the console so
  // server-side session drift is observable instead of silently hidden.
  fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(
    (err) => {
      console.warn("[auth] logout server call failed", err);
    },
  );
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
