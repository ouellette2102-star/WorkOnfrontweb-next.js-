/**
 * WorkOn Public API — no auth required
 * Used by landing pages (ISR / SSR)
 */

// Support both env formats: "https://host" or "https://host/api/v1".
// Vercel sets NEXT_PUBLIC_API_URL WITH the /api/v1 suffix (same as api-client.ts),
// so we must strip a trailing /api/v1 before re-appending — otherwise we'd
// build /api/v1/api/v1/... and every fetch here 404s silently.
const RAW_BASE = (
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "https://workon-backend-production-8908.up.railway.app"
).replace(/\/api\/v1$/, "");
const API_BASE = `${RAW_BASE}/api/v1`;

// ─── DTOs ──────────────────────────────────────────────────────────────────

export interface PublicStats {
  activeWorkers: number;
  completedMissions: number;
  openMissions: number;
  sectorCount: number;
  activeCities: number;
  averagePlatformRating: number;
}

export interface WorkerBadge {
  label: string;
  type: string;
}

export interface FeaturedWorker {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  city?: string;
  photoUrl?: string;
  sector?: string;
  jobTitle?: string | null;
  hourlyRate?: number | null;
  portfolioPhotos?: string[];
  ratingAvg: number;
  ratingCount: number;
  completedMissions: number;
  badges: WorkerBadge[];
  /**
   * Trust tier of the worker. Aligned with backend `LocalUser.trustTier`
   * (Prisma enum) — see `docs/BACKEND_PIPELINE.md`. The four tiers are:
   * - BASIC:    default, email verified only
   * - VERIFIED: phone verified
   * - TRUSTED:  phone + ID verified
   * - PREMIUM:  phone + ID + bank verified (workers only)
   */
  trustTier: "BASIC" | "VERIFIED" | "TRUSTED" | "PREMIUM";
}

export interface PublicWorkerProfile extends FeaturedWorker {
  bio?: string;
  sectors: string[];
  memberSince: string;
  reviews: FeaturedReview[];
  portfolioPhotos: string[];
}

export interface FeaturedReview {
  id: string;
  rating: number;
  comment: string;
  authorName?: string;
  workerName?: string;
  createdAt: string;
}

export interface PublicMission {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  priceRange: string;
  status: string;
  createdAt: string;
  /**
   * Boost flags — populated server-side by `PublicService.getPublicMissions`.
   * `isUrgent` is only true while the URGENT_9 boost window is still open
   * (BE normalises expired boosts). Older BE deployments may omit these
   * fields entirely, so they are optional on the client.
   */
  isUrgent?: boolean;
  urgentUntil?: string | null;
  boostedUntil?: string | null;
  /**
   * Oldest attached MissionPhoto URL, surfaced server-side. `null` when
   * the mission has no photos. Drives the mission-card hero image.
   */
  firstPhotoUrl?: string | null;
  /**
   * Number of PENDING offers on the mission. Server-aggregated from
   * LocalOffer. Drives the "X offres reçues" social-proof line.
   */
  offersCount?: number;
}

export interface PublicMissionsResponse {
  missions: PublicMission[];
  total: number;
  page: number;
}

export interface SectorStat {
  category: string;
  missionCount: number;
  workerCount: number;
}

// ─── Fetch helpers ──────────────────────────────────────────────────────────

async function publicFetch<T>(
  path: string,
  revalidate: number | false = 60,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Public API functions ───────────────────────────────────────────────────

/** Platform stats — ISR 300s (homepage) */
export const getPublicStats = () =>
  publicFetch<PublicStats>("/public/stats", 300);

/** Featured workers — ISR 120s */
export const getFeaturedWorkers = (limit = 9) =>
  publicFetch<FeaturedWorker[]>(`/public/workers/featured?limit=${limit}`, 120);

/** Worker public profile — SSR (always fresh) */
export const getWorkerBySlug = (slug: string) =>
  publicFetch<PublicWorkerProfile | null>(
    `/public/workers/${encodeURIComponent(slug)}`,
    false,
  );

/** Featured reviews — ISR 300s */
export const getFeaturedReviews = (limit = 6) =>
  publicFetch<FeaturedReview[]>(`/public/reviews/featured?limit=${limit}`, 300);

/** Public missions feed — ISR 30s */
export const getPublicMissions = (params?: {
  category?: string;
  city?: string;
  page?: number;
  limit?: number;
}) => {
  const q = new URLSearchParams();
  if (params?.category) q.set("category", params.category);
  if (params?.city) q.set("city", params.city);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  return publicFetch<PublicMissionsResponse>(
    `/public/missions?${q.toString()}`,
    30,
  );
};

/** Sector stats — ISR 300s */
export const getSectorStats = () =>
  publicFetch<SectorStat[]>("/public/sectors/stats", 300);
