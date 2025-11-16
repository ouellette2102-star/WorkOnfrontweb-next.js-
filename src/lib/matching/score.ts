import { Mission, WorkerProfile, User, UserProfile } from "@prisma/client";

interface MatchFeatures {
  distance: number; // km
  skillsOverlap: number; // 0-1
  rating: number; // 0-5
  sla: number; // 0-1 (response time, completion rate)
  responseTime: number; // hours
  priceFit: number; // 0-1
  availability: number; // 0-1
}

interface MatchWeights {
  distance: number;
  skillsOverlap: number;
  rating: number;
  sla: number;
  responseTime: number;
  priceFit: number;
  availability: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  distance: 0.2,
  skillsOverlap: 0.25,
  rating: 0.15,
  sla: 0.15,
  responseTime: 0.1,
  priceFit: 0.1,
  availability: 0.05,
};

/**
 * Calcule la distance en km entre deux points GPS (formule de Haversine)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normalise une valeur entre min et max vers 0-1 (inverse: plus grand = meilleur)
 */
function normalizeInverse(value: number, min: number, max: number): number {
  if (max === min) return 1;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, 1 - normalized)); // Inverse: plus proche de max = plus proche de 0
}

/**
 * Normalise une valeur entre min et max vers 0-1 (direct: plus grand = meilleur)
 */
function normalizeDirect(value: number, min: number, max: number): number {
  if (max === min) return 1;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calcule les features de matching entre une mission et un worker
 */
export function computeMatchFeatures(
  mission: Mission & { category: { skills: Array<{ id: string }> } },
  worker: WorkerProfile & {
    user: User & { profile: UserProfile | null };
    skills: Array<{ skillId: string }>;
  },
  options?: {
    maxDistance?: number;
    defaultResponseTime?: number;
  }
): MatchFeatures {
  const maxDistance = options?.maxDistance ?? 50; // 50km par défaut
  const defaultResponseTime = options?.defaultResponseTime ?? 24; // 24h par défaut

  // Distance
  const distanceScore = normalizeInverse(maxDistance, 0, maxDistance);

  // Skills overlap
  const requiredSkillIds = new Set(mission.requiredSkills);
  const workerSkillIds = new Set(worker.skills.map((s) => s.skillId));
  const commonSkills = Array.from(requiredSkillIds).filter((id) =>
    workerSkillIds.has(id)
  );
  const skillsOverlap =
    requiredSkillIds.size > 0
      ? commonSkills.length / requiredSkillIds.size
      : 0.5; // Si pas de skills requis, score neutre

  // Rating (normalisé 0-5 -> 0-1)
  const derivedRating = Math.min(5, worker.completedMissions / 10);
  const rating = normalizeDirect(derivedRating, 0, 5);

  // SLA (basé sur completedMissions et rating)
  const sla = Math.min(
    1,
    normalizeDirect(worker.completedMissions, 0, 50) * 0.7 +
      rating * 0.3
  );

  // Response time (placeholder: basé sur historique, défaut 24h)
  const responseTime = defaultResponseTime;
  const responseTimeScore = normalizeInverse(responseTime, 0, 48); // 0-48h

  // Price fit
  let priceFit = 0.5;
  if (mission.priceType === "HOURLY" && worker.hourlyRate) {
    const rate = worker.hourlyRate;
    if (rate >= mission.budgetMin && rate <= mission.budgetMax) {
      priceFit = 1;
    } else {
      const mid = (mission.budgetMin + mission.budgetMax) / 2;
      const diff = Math.abs(rate - mid);
      const range = mission.budgetMax - mission.budgetMin;
      priceFit = Math.max(0, 1 - diff / range);
    }
  } else if (mission.priceType === "FIXED") {
    // Pour fixed, on compare avec le taux horaire estimé
    priceFit = 0.7; // Placeholder
  }

  // Availability (placeholder: basé sur instantToggle et schedules)
  const availability = worker.availability
    ? (worker.availability as { instantToggle?: boolean }).instantToggle
      ? 1
      : 0.5
    : 0.3;

  return {
    distance: distanceScore,
    skillsOverlap,
    rating,
    sla,
    responseTime: responseTimeScore,
    priceFit,
    availability,
  };
}

/**
 * Calcule le score de matching final (0-100)
 */
export function computeMatchScore(
  features: MatchFeatures,
  weights: MatchWeights = DEFAULT_WEIGHTS
): number {
  const score =
    features.distance * weights.distance +
    features.skillsOverlap * weights.skillsOverlap +
    features.rating * weights.rating +
    features.sla * weights.sla +
    features.responseTime * weights.responseTime +
    features.priceFit * weights.priceFit +
    features.availability * weights.availability;

  return Math.round(score * 100);
}

/**
 * Calcule le score de matching complet pour une mission et un worker
 */
export async function matchMissionToWorker(
  mission: Mission & { category: { skills: Array<{ id: string }> } },
  worker: WorkerProfile & {
    user: User & { profile: UserProfile | null };
    skills: Array<{ skillId: string }>;
  },
  weights?: MatchWeights
): Promise<{ score: number; features: MatchFeatures }> {
  const features = computeMatchFeatures(mission, worker);
  const score = computeMatchScore(features, weights);
  return { score, features };
}

