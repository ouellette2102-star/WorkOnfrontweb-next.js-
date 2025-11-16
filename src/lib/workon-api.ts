const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

export type PrimaryRole =
  | "WORKER"
  | "EMPLOYER"
  | "CLIENT_RESIDENTIAL"
  | "ADMIN";

export type ProfileResponse = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
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

async function request<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[WorkOn API] Request failed", {
      url,
      status: response.status,
      body: errorBody,
    });
    throw new Error(`WorkOn API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchProfile(token: string): Promise<ProfileResponse> {
  return request<ProfileResponse>("/profile/me", token);
}

export async function saveProfile(
  token: string,
  payload: ProfileUpdatePayload,
): Promise<ProfileResponse> {
  return request<ProfileResponse>("/profile/me", token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}