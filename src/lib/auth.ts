/**
 * WorkOn Authentication Client
 *
 * Uses Next.js API routes as proxy to set httpOnly cookies.
 * Tokens are stored in httpOnly cookies (secure) + localStorage (UI cache only).
 * The middleware reads the workon_token cookie for route protection.
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

// --- Token Storage (localStorage for UI cache + cookie via proxy) ---

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

function storeAuth(res: { accessToken?: string; refreshToken?: string; user: AuthUser }) {
  // Store in localStorage for client-side access (UI cache)
  if (res.accessToken) {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
  }
  if (res.refreshToken) {
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  // Also set a non-httpOnly cookie for the middleware (route protection)
  // The httpOnly cookie is set by the API route proxy
  if (res.accessToken) {
    document.cookie = `workon_token=${res.accessToken};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
  }
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "workon_token=;path=/;max-age=0";
}

// --- API Calls (via proxy routes for httpOnly cookies) ---

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export async function login(dto: LoginDto): Promise<{ user: AuthUser }> {
  // Call the proxy route which sets httpOnly cookies
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

  const data = await res.json();

  // Also call backend directly to get tokens for localStorage cache
  // (needed by api-client.ts which reads from localStorage)
  const directRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (directRes.ok) {
    const directData = await directRes.json();
    storeAuth(directData);
  } else {
    // Fallback: store user from proxy response
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data;
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

  const data = await res.json();

  // Also call backend directly for localStorage tokens
  const directRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (directRes.ok) {
    const directData = await directRes.json();
    storeAuth(directData);
  } else {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data;
}

export async function refreshToken(): Promise<string | null> {
  const refresh = getRefreshTokenValue();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) {
      clearAuth();
      return null;
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    // Update the cookie for middleware
    document.cookie = `workon_token=${data.accessToken};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
    return data.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getAccessToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    const newToken = await refreshToken();
    if (!newToken) return null;
    const retry = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    if (!retry.ok) return null;
    const user = await retry.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  if (!res.ok) return null;
  const user = await res.json();
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  clearAuth();
  // Also call proxy to clear httpOnly cookies
  fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
