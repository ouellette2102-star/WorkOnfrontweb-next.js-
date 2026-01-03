/**
 * Types pour les reviews WorkOn
 * Alignés avec le backend NestJS
 */

export interface CreateReviewPayload {
  missionId: string;
  workerId: string;
  rating: number; // 1-5
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  rating: number;
  comment: string | null;
  missionId: string;
  authorId: string;
  workerId: string;
  createdAt: string;
}

// Normalized API responses (following PR-17 pattern)
export type CreateReviewApiResponse =
  | { ok: true; data: ReviewResponse }
  | { ok: false; error: { code: string; message: string } };

