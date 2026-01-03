/**
 * Score de matching pour les missions WorkOn
 * Types locaux decouples de Prisma
 */

import type { UserProfile, WorkerProfile } from "@/types/profile";

/**
 * Types locaux pour le matching (alignes avec les reponses API backend)
 */
interface MissionForMatching {
  id: string;
  requiredSkills: string[];
  priceType: "HOURLY" | "FIXED" | null;
  budgetMin: number;
  budgetMax: number;
  category?: {
    skills: Array<{ id: string }>;
  } | null;
}

interface WorkerForMatching {
  completedMissions: number;
  hourlyRate: number;
  availability: { instantToggle?: boolean } | null;
  skills: Array<{ skillId: string }>;
  user?: {
    profile: UserProfile | null;
  } | null;
}

interface MatchFeatures {
  distance: number;
  skillsOverlap: number;
  rating: number;
  sla: number;
  responseTime: number;
  priceFit: number;
  availability: number;
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

function normalizeInverse(value: number, min: number, max: number): number {
  if (max === min) return 1;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, 1 - normalized));
}

function normalizeDirect(value: number, min: number, max: number): number {
  if (max === min) return 1;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function computeMatchFeatures(
  mission: MissionForMatching,
  worker: WorkerForMatching,
  options?: {
    maxDistance?: number;
    defaultResponseTime?: number;
  }
): MatchFeatures {
  const maxDistance = options?.maxDistance ?? 50;
  const defaultResponseTime = options?.defaultResponseTime ?? 24;

  const distanceScore = normalizeInverse(maxDistance, 0, maxDistance);

  const requiredSkillIds = new Set(mission.requiredSkills);
  const workerSkillIds = new Set(worker.skills.map((s) => s.skillId));
  const commonSkills = Array.from(requiredSkillIds).filter((id) =>
    workerSkillIds.has(id)
  );
  const skillsOverlap =
    requiredSkillIds.size > 0
      ? commonSkills.length / requiredSkillIds.size
      : 0.5;

  const derivedRating = Math.min(5, worker.completedMissions / 10);
  const rating = normalizeDirect(derivedRating, 0, 5);

  const sla = Math.min(
    1,
    normalizeDirect(worker.completedMissions, 0, 50) * 0.7 + rating * 0.3
  );

  const responseTime = defaultResponseTime;
  const responseTimeScore = normalizeInverse(responseTime, 0, 48);

  let priceFit = 0.5;
  if (mission.priceType === "HOURLY" && worker.hourlyRate) {
    const rate = worker.hourlyRate;
    if (rate >= mission.budgetMin && rate <= mission.budgetMax) {
      priceFit = 1;
    } else {
      const mid = (mission.budgetMin + mission.budgetMax) / 2;
      const diff = Math.abs(rate - mid);
      const range = mission.budgetMax - mission.budgetMin || 1;
      priceFit = Math.max(0, 1 - diff / range);
    }
  } else if (mission.priceType === "FIXED") {
    priceFit = 0.7;
  }

  const availability = worker.availability?.instantToggle ? 1 : 0.3;

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

export async function matchMissionToWorker(
  mission: MissionForMatching,
  worker: WorkerForMatching,
  weights?: MatchWeights
): Promise<{ score: number; features: MatchFeatures }> {
  const features = computeMatchFeatures(mission, worker);
  const score = computeMatchScore(features, weights);
  return { score, features };
}

export type {
  MissionForMatching,
  WorkerForMatching,
  MatchFeatures,
  MatchWeights,
};
