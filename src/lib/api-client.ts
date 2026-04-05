import { getAccessToken, refreshToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type FetchOptions = RequestInit & { skipAuth?: boolean };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (!skipAuth) {
    let token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Erreur serveur" }));
    throw new ApiError(res.status, err.message || "Erreur serveur", err.error);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// --- Types ---

export interface MissionResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "open" | "assigned" | "in_progress" | "completed" | "paid" | "cancelled";
  price: number;
  latitude: number;
  longitude: number;
  city: string;
  address: string | null;
  createdByUserId: string;
  assignedToUserId: string | null;
  distanceKm?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MissionMapItem {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  status: string;
  price: number;
  city?: string;
  createdAt: string;
}

export interface OfferResponse {
  id: string;
  missionId: string;
  workerId: string;
  price: number;
  message: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  worker?: { id: string; firstName: string; lastName: string; city: string | null };
  mission?: { id: string; title: string; description: string; category: string; price: number; city: string; status: string; createdAt: string };
  createdAt: string;
}

export interface WorkerProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  jobTitle?: string;
  city?: string;
  photoUrl?: string;
  averageRating: number;
  completionPercentage: number;
  reviewCount: number;
  completedMissions: number;
  badges: { label: string; type: string }[];
  hourlyRate?: number;
}

export interface ConversationItem {
  missionId: string;
  missionTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  otherUser: { id: string; firstName: string; lastName: string };
}

export interface ChatMessage {
  id: string;
  missionId: string;
  senderId: string;
  senderRole: string;
  content: string;
  status: string;
  createdAt: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  nameEn: string | null;
  icon: string | null;
  residentialAllowed: boolean;
}

export interface HomeStats {
  completedContracts: number;
  activeWorkers: number;
  openServiceCalls: number;
}

export interface ConsentStatus {
  isComplete: boolean;
  documents: Record<string, { accepted: boolean; version: string | null; acceptedAt: string | null; activeVersion: string }>;
  missing: string[];
}

export interface EarningsSummary {
  totalGross: number;
  totalNet: number;
  totalPaid: number;
  totalPending: number;
  commissionRate: number;
}

// --- API Methods ---

export const api = {
  // Metrics (public)
  getHomeStats: () => apiFetch<HomeStats>("/metrics/home-stats", { skipAuth: true }),
  getRegions: () => apiFetch<string[]>("/metrics/regions", { skipAuth: true }),

  // Catalog (public)
  getCategories: () => apiFetch<CategoryResponse[]>("/catalog/categories", { skipAuth: true }),

  // Workers (public)
  getWorkers: (params?: { city?: string; category?: string; limit?: number; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.city) q.set("city", params.city);
    if (params?.category) q.set("category", params.category);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.page) q.set("page", String(params.page));
    return apiFetch<{ workers: WorkerProfile[]; total: number; page: number; limit: number }>(
      `/profiles/workers?${q}`,
      { skipAuth: true },
    );
  },
  getWorker: (id: string) => apiFetch<WorkerProfile>(`/profiles/workers/${id}`, { skipAuth: true }),

  // Missions
  createMission: (data: { title: string; description: string; category: string; price: number; latitude: number; longitude: number; city: string; address?: string }) =>
    apiFetch<MissionResponse>("/missions-local", { method: "POST", body: JSON.stringify(data) }),

  getMissionMapPins: (bbox: { north: number; south: number; east: number; west: number; category?: string }) => {
    const q = new URLSearchParams({
      north: String(bbox.north),
      south: String(bbox.south),
      east: String(bbox.east),
      west: String(bbox.west),
    });
    if (bbox.category) q.set("category", bbox.category);
    return apiFetch<{ missions: MissionMapItem[]; count: number }>(`/missions-local/map?${q}`);
  },

  getNearbyMissions: (params: { latitude: number; longitude: number; radiusKm?: number; category?: string; sort?: string }) => {
    const q = new URLSearchParams({ latitude: String(params.latitude), longitude: String(params.longitude) });
    if (params.radiusKm) q.set("radiusKm", String(params.radiusKm));
    if (params.category) q.set("category", params.category);
    if (params.sort) q.set("sort", params.sort);
    return apiFetch<MissionResponse[]>(`/missions-local/nearby?${q}`);
  },

  getMyMissions: () => apiFetch<MissionResponse[]>("/missions-local/my-missions"),
  getMyAssignments: () => apiFetch<MissionResponse[]>("/missions-local/my-assignments"),
  getMission: (id: string) => apiFetch<MissionResponse>(`/missions-local/${id}`),

  acceptMission: (id: string) => apiFetch<MissionResponse>(`/missions-local/${id}/accept`, { method: "POST" }),
  startMission: (id: string) => apiFetch<MissionResponse>(`/missions-local/${id}/start`, { method: "POST" }),
  completeMission: (id: string) => apiFetch<MissionResponse>(`/missions-local/${id}/complete`, { method: "POST" }),
  cancelMission: (id: string) => apiFetch<MissionResponse>(`/missions-local/${id}/cancel`, { method: "POST" }),

  // Offers
  createOffer: (data: { missionId: string; price: number; message?: string }) =>
    apiFetch<OfferResponse>("/offers", { method: "POST", body: JSON.stringify(data) }),
  getOffersForMission: (missionId: string) => apiFetch<OfferResponse[]>(`/offers/mission/${missionId}`),
  getMyOffers: () => apiFetch<OfferResponse[]>("/offers/mine"),
  acceptOffer: (id: string) => apiFetch<OfferResponse>(`/offers/${id}/accept`, { method: "PATCH" }),
  rejectOffer: (id: string) => apiFetch<OfferResponse>(`/offers/${id}/reject`, { method: "PATCH" }),

  // Messages
  getConversations: () => apiFetch<ConversationItem[]>("/messages-local/conversations"),
  getThread: (missionId: string) => apiFetch<ChatMessage[]>(`/messages-local/thread/${missionId}`),
  sendMessage: (data: { missionId: string; content: string }) =>
    apiFetch<ChatMessage>("/messages-local", { method: "POST", body: JSON.stringify(data) }),
  markRead: (missionId: string) => apiFetch<void>(`/messages-local/read/${missionId}`, { method: "PATCH" }),
  getUnreadCount: () => apiFetch<{ count: number }>("/messages-local/unread-count"),

  // Profile
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; city?: string }) =>
    apiFetch<unknown>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<unknown>("/users/me/picture", { method: "POST", body: formData });
  },

  // Compliance
  getConsentStatus: () => apiFetch<ConsentStatus>("/compliance/status"),
  acceptDocument: (documentType: "TERMS" | "PRIVACY", version: string) =>
    apiFetch<unknown>("/compliance/accept", { method: "POST", body: JSON.stringify({ documentType, version }) }),
  getConsentVersions: () => apiFetch<{ versions: Record<string, string> }>("/compliance/versions", { skipAuth: true }),

  // Earnings
  getEarningsSummary: () => apiFetch<EarningsSummary>("/earnings/summary"),

  // Payments
  createPaymentIntent: (data: { missionId: string; amount: number }) =>
    apiFetch<{ clientSecret: string }>("/payments-local/intent", { method: "POST", body: JSON.stringify(data) }),

  // Support
  createTicket: (data: { subject: string; description: string; category?: string }) =>
    apiFetch<unknown>("/support/tickets", { method: "POST", body: JSON.stringify(data) }),
};
