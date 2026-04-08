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
 */

const TOKEN_KEY = "workon_access_token";
const REFRESH_KEY = "workon_refresh_token";
const USER_KEY = "workon_user";

export type UserRole = "worker" | "employer" | "residential_client";

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
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshTokenValue(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
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
  if (typeof window === "undefined") return;
  if (res.accessToken) {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
  }
  if (res.refreshToken) {
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(res.user));
}

function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
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

export async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      clearAuth();
      return null;
    }
    const data = await res.json();
    if (typeof window !== "undefined") {
      if (data.accessToken) localStorage.setItem(TOKEN_KEY, data.accessToken);
      if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
    }
    return data.accessToken ?? null;
  } catch {
    clearAuth();
    return null;
  }
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
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
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
