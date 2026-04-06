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

export interface WorkerPayment {
  id: string;
  missionId: string;
  missionTitle: string;
  missionCategory: string | null;
  amountCents: number;
  feeCents: number;
  netAmountCents: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  completedAt: string | null;
  createdAt: string;
}

export interface InvoiceResponse {
  id: string;
  localMissionId: string;
  subtotalCents: number;
  platformFeeCents: number;
  taxCents: number;
  totalCents: number;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  createdAt: string;
  paidAt: string | null;
}

export interface InvoicePreview {
  subtotalCents: number;
  platformFeeCents: number;
  taxCents: number;
  totalCents: number;
}

export interface ContractResponse {
  id: string;
  missionId: string | null;
  localMissionId: string | null;
  status: "DRAFT" | "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  terms: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeResponse {
  id: string;
  missionId: string | null;
  localMissionId: string | null;
  reason: string;
  description: string;
  status: "OPEN" | "IN_MEDIATION" | "RESOLVED" | "CLOSED";
  resolution: string | null;
  evidence: unknown[];
  timeline: unknown[];
  createdAt: string;
}

export interface BookingResponse {
  id: string;
  templateId: string | null;
  clientId: string;
  workerId: string;
  scheduledDate: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes: string | null;
  createdAt: string;
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
}

export interface RecurringTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  recurrence: "ONCE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";
  isActive: boolean;
  createdAt: string;
}

export interface SwipeCandidate {
  id: string;
  firstName: string;
  lastName: string;
  city: string | null;
  pictureUrl: string | null;
  role: string;
  averageRating: number | null;
  categories: string[];
  distanceKm: number | null;
}

export interface SwipeMatch {
  id: string;
  userId: string;
  matchedUserId: string;
  matchedUser: { id: string; firstName: string; lastName: string; city: string | null; pictureUrl: string | null };
  status: "ACTIVE" | "EXPIRED";
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_USER" | "WAITING_ADMIN" | "RESOLVED" | "CLOSED";
  messages: unknown[];
  createdAt: string;
}

export interface VerificationStatus {
  phoneVerified: boolean;
  idVerified: boolean;
  trustTier: "BASIC" | "VERIFIED" | "TRUSTED" | "PREMIUM";
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<string, number>;
}

export interface ReviewResponse {
  id: string;
  rating: number;
  comment: string | null;
  reviewerName: string;
  createdAt: string;
}

// Re-export PrimaryRole for backward compat with workon-api.ts consumers
export type PrimaryRole = "WORKER" | "EMPLOYER" | "CLIENT_RESIDENTIAL" | "ADMIN";

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
  getEarningsHistory: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return apiFetch<unknown>(`/earnings/history${qs ? `?${qs}` : ""}`);
  },
  getEarningsByMission: (missionId: string) => apiFetch<unknown>(`/earnings/by-mission/${missionId}`),

  // Payments
  createPaymentIntent: (data: { missionId: string; amount: number }) =>
    apiFetch<{ clientSecret: string }>("/payments-local/intent", { method: "POST", body: JSON.stringify(data) }),

  // Stripe Connect
  getStripeOnboardingLink: () => apiFetch<{ url: string }>("/payments/connect/onboarding"),
  getStripeOnboardingStatus: () =>
    apiFetch<{ onboarded: boolean; chargesEnabled: boolean; payoutsEnabled: boolean; requirementsNeeded: string[] }>(
      "/payments/connect/status",
    ),
  getWorkerPaymentHistory: () => apiFetch<WorkerPayment[]>("/payments/worker/history"),

  // Stripe Checkout
  createCheckoutSession: (missionId: string) =>
    apiFetch<{ checkoutUrl: string; invoiceId: string; sessionId: string }>("/payments/checkout", {
      method: "POST",
      body: JSON.stringify({ localMissionId: missionId }),
    }),

  // Invoices
  getInvoice: (id: string) => apiFetch<InvoiceResponse>(`/payments/invoice/${id}`),
  previewInvoice: (priceCents: number) =>
    apiFetch<InvoicePreview>(`/payments/preview?priceCents=${priceCents}`),

  // Notifications
  getNotifications: (unreadOnly?: boolean) =>
    apiFetch<unknown[]>(`/notifications${unreadOnly ? "?unreadOnly=true" : ""}`),
  getNotificationUnreadCount: () => apiFetch<{ count: number }>("/notifications/unread-count"),
  markNotificationRead: (id: string) => apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => apiFetch<{ count: number }>("/notifications/read-all", { method: "PATCH" }),

  // Contracts
  getMyContracts: () => apiFetch<ContractResponse[]>("/contracts/user/me"),
  getContract: (id: string) => apiFetch<ContractResponse>(`/contracts/${id}`),
  createContract: (data: { missionId?: string; localMissionId?: string; terms?: string }) =>
    apiFetch<ContractResponse>("/contracts", { method: "POST", body: JSON.stringify(data) }),
  updateContractStatus: (id: string, status: string) =>
    apiFetch<ContractResponse>(`/contracts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Disputes
  createDispute: (data: { localMissionId?: string; missionId?: string; reason: string; description: string }) =>
    apiFetch<DisputeResponse>("/disputes", { method: "POST", body: JSON.stringify(data) }),
  getDispute: (id: string) => apiFetch<DisputeResponse>(`/disputes/${id}`),
  getDisputeForMission: (missionId: string) => apiFetch<DisputeResponse>(`/disputes/mission/${missionId}`),
  addDisputeEvidence: (disputeId: string, data: FormData) =>
    apiFetch<unknown>(`/disputes/${disputeId}/evidence`, { method: "POST", body: data }),
  resolveDispute: (id: string, data: { resolution: string }) =>
    apiFetch<DisputeResponse>(`/disputes/${id}/resolve`, { method: "PATCH", body: JSON.stringify(data) }),

  // Bookings
  createBooking: (data: { templateId?: string; workerId?: string; scheduledDate: string; notes?: string }) =>
    apiFetch<BookingResponse>("/scheduling/bookings", { method: "POST", body: JSON.stringify(data) }),
  getMyBookings: (filters?: { status?: string; upcoming?: boolean }) => {
    const q = new URLSearchParams();
    if (filters?.status) q.set("status", filters.status);
    if (filters?.upcoming) q.set("upcoming", "true");
    const qs = q.toString();
    return apiFetch<BookingResponse[]>(`/scheduling/bookings/mine${qs ? `?${qs}` : ""}`);
  },
  getWorkerBookings: (filters?: { status?: string; upcoming?: boolean }) => {
    const q = new URLSearchParams();
    if (filters?.status) q.set("status", filters.status);
    if (filters?.upcoming) q.set("upcoming", "true");
    const qs = q.toString();
    return apiFetch<BookingResponse[]>(`/scheduling/bookings/worker${qs ? `?${qs}` : ""}`);
  },
  confirmBooking: (id: string) => apiFetch<BookingResponse>(`/scheduling/bookings/${id}/confirm`, { method: "PATCH" }),
  cancelBooking: (id: string) => apiFetch<BookingResponse>(`/scheduling/bookings/${id}/cancel`, { method: "PATCH" }),
  completeBooking: (id: string) => apiFetch<BookingResponse>(`/scheduling/bookings/${id}/complete`, { method: "PATCH" }),

  // Availability
  getAvailability: () => apiFetch<AvailabilitySlot[]>("/scheduling/availability"),
  setAvailability: (data: { dayOfWeek: number; startTime: string; endTime: string }) =>
    apiFetch<AvailabilitySlot>("/scheduling/availability", { method: "POST", body: JSON.stringify(data) }),
  blockTime: (data: { date: string; reason?: string }) =>
    apiFetch<unknown>("/scheduling/availability/block", { method: "POST", body: JSON.stringify(data) }),

  // Templates
  getTemplates: () => apiFetch<RecurringTemplate[]>("/scheduling/templates"),
  createTemplate: (data: { title: string; description: string; category: string; price: number; recurrence: string }) =>
    apiFetch<RecurringTemplate>("/scheduling/templates", { method: "POST", body: JSON.stringify(data) }),
  deactivateTemplate: (id: string) =>
    apiFetch<RecurringTemplate>(`/scheduling/templates/${id}/deactivate`, { method: "PATCH" }),
  generateFromTemplate: (id: string) =>
    apiFetch<unknown>(`/scheduling/templates/${id}/generate`, { method: "POST" }),

  // Swipe Discovery
  getSwipeCandidates: (filters?: { role?: string; category?: string; latitude?: number; longitude?: number }) => {
    const q = new URLSearchParams();
    if (filters?.role) q.set("role", filters.role);
    if (filters?.category) q.set("category", filters.category);
    if (filters?.latitude) q.set("latitude", String(filters.latitude));
    if (filters?.longitude) q.set("longitude", String(filters.longitude));
    const qs = q.toString();
    return apiFetch<SwipeCandidate[]>(`/swipe/candidates${qs ? `?${qs}` : ""}`);
  },
  recordSwipe: (data: { targetUserId: string; action: "LIKE" | "PASS" | "SUPERLIKE" }) =>
    apiFetch<{ matched: boolean; matchId?: string }>("/swipe/action", { method: "POST", body: JSON.stringify(data) }),
  getMatches: () => apiFetch<SwipeMatch[]>("/swipe/matches"),
  createMissionFromMatch: (matchId: string, data?: { title?: string; description?: string; price?: number }) =>
    apiFetch<MissionResponse>("/swipe/matches/mission", { method: "POST", body: JSON.stringify({ matchId, ...data }) }),

  // Support
  createTicket: (data: { subject: string; description: string; category?: string; priority?: string }) =>
    apiFetch<SupportTicket>("/support/tickets", { method: "POST", body: JSON.stringify(data) }),
  getMyTickets: () => apiFetch<SupportTicket[]>("/support/tickets"),
  getTicket: (id: string) => apiFetch<SupportTicket>(`/support/tickets/${id}`),
  addTicketMessage: (id: string, data: { content: string }) =>
    apiFetch<unknown>(`/support/tickets/${id}/messages`, { method: "POST", body: JSON.stringify(data) }),
  closeTicket: (id: string) => apiFetch<SupportTicket>(`/support/tickets/${id}/close`, { method: "PATCH" }),

  // Identity Verification
  startPhoneVerification: () => apiFetch<unknown>("/identity/verify/phone", { method: "POST" }),
  confirmPhoneOtp: (code: string) =>
    apiFetch<unknown>("/identity/verify/phone/confirm", { method: "POST", body: JSON.stringify({ code }) }),
  startIdVerification: () => apiFetch<unknown>("/identity/verify/id/start", { method: "POST" }),
  getVerificationStatus: () => apiFetch<VerificationStatus>("/identity/status"),

  // Devices
  registerDevice: (data: { token: string; platform: string }) =>
    apiFetch<unknown>("/devices", { method: "POST", body: JSON.stringify(data) }),
  getMyDevices: () => apiFetch<unknown[]>("/devices/me"),
  unregisterDevice: (id: string) => apiFetch<void>(`/devices/${id}`, { method: "DELETE" }),

  // Reviews
  getReviewSummary: (userId: string) => apiFetch<ReviewSummary>(`/reviews/summary?userId=${userId}`),
  getReviews: (userId: string, page?: number) => {
    const q = new URLSearchParams({ userId });
    if (page) q.set("page", String(page));
    return apiFetch<ReviewResponse[]>(`/reviews?${q}`);
  },
  createReview: (data: { missionId?: string; localMissionId?: string; targetUserId: string; rating: number; comment?: string }) =>
    apiFetch<ReviewResponse>("/reviews", { method: "POST", body: JSON.stringify(data) }),

  // Mission Events
  getMissionEvents: (missionId: string) => apiFetch<unknown[]>(`/missions/${missionId}/events`),

  // Legacy Missions (Clerk-era endpoints, kept for backward compatibility)
  legacy: {
    getMissions: () => apiFetch<unknown[]>("/missions/mine"),
    getAvailableMissions: (filters?: { city?: string; category?: string }) => {
      const q = new URLSearchParams();
      if (filters?.city) q.set("city", filters.city);
      if (filters?.category) q.set("category", filters.category);
      const qs = q.toString();
      return apiFetch<unknown[]>(`/missions/available${qs ? `?${qs}` : ""}`);
    },
    getMissionFeed: (filters?: { category?: string; city?: string; latitude?: number; longitude?: number; maxDistance?: number }) => {
      const q = new URLSearchParams();
      if (filters?.category) q.set("category", filters.category);
      if (filters?.city) q.set("city", filters.city);
      if (filters?.latitude !== undefined) q.set("latitude", String(filters.latitude));
      if (filters?.longitude !== undefined) q.set("longitude", String(filters.longitude));
      if (filters?.maxDistance !== undefined) q.set("maxDistance", String(filters.maxDistance));
      const qs = q.toString();
      return apiFetch<unknown[]>(`/missions/feed${qs ? `?${qs}` : ""}`);
    },
    getMission: (id: string) => apiFetch<unknown>(`/missions/${id}`),
    reserveMission: (id: string) => apiFetch<unknown>(`/missions/${id}/reserve`, { method: "POST" }),
    updateMissionStatus: (id: string, payload: { status: string }) =>
      apiFetch<unknown>(`/missions/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
  },

  // Profile (workon-api.ts compat)
  fetchProfile: () => apiFetch<unknown>("/profile/me"),
  saveProfile: (data: { primaryRole?: string; fullName?: string; phone?: string; city?: string }) =>
    apiFetch<unknown>("/profile/me", { method: "PATCH", body: JSON.stringify(data) }),
};
