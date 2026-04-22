/**
 * Zod response schemas for the 5 most critical backend endpoints.
 *
 * Phase 6 Week 2, PR #96 from the audit roadmap. Closes audit risk
 * #7: the frontend currently trusts backend response shapes blindly
 * via TypeScript (compile-time only). If the backend ever changes
 * a field name or nullability, the app silently runs on malformed
 * data until something crashes deep in a component.
 *
 * With Zod response validation, a shape mismatch throws a clear
 * `ZodError` at the api-client layer — visible in the UI via the
 * ErrorBoundary (PR #95) and reported to Sentry (PR #94). Much
 * better than the current silent garbage.
 *
 * We only validate the 5 highest-impact endpoints in this PR:
 *   - GET  /users/me              (api.fetchProfile)
 *   - GET  /missions-local/my-missions     (api.getMyMissions)
 *   - GET  /missions-local/my-assignments  (api.getMyAssignments)
 *   - GET  /messages-local/conversations   (api.getConversations)
 *   - GET  /payments/stripe/connect/status (api.getStripeOnboardingStatus)
 *
 * Extending this to more endpoints is mechanical: add a schema,
 * wire it into the api-client method via `parseResponse(schema)`.
 */

import { z } from "zod";

// ─── User / profile ──────────────────────────────────────────────────────────

/**
 * Canonical response shape for GET /users/me. Matches the mapper
 * target in api-client.ts `mapUserToProfileResponse()`. Fields that
 * the backend sometimes sends null are explicitly `.nullable()`.
 */
export const userMeSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  city: z.string().nullable(),
  pictureUrl: z.string().nullable().optional(),
  role: z.string(),
  // Revenu Québec IN-203 invoice fields. Optional on the wire so older
  // BE deploys (or partial account states) keep hydrating; the UI
  // treats undefined / null as "not filled yet".
  businessName: z.string().nullable().optional(),
  businessCategory: z.string().nullable().optional(),
  businessDescription: z.string().nullable().optional(),
  businessWebsite: z.string().nullable().optional(),
  businessAddress: z.string().nullable().optional(),
  gstNumber: z.string().nullable().optional(),
  qstNumber: z.string().nullable().optional(),
});

export type UserMeResponse = z.infer<typeof userMeSchema>;

// ─── Missions ───────────────────────────────────────────────────────────────

/**
 * Canonical mission shape from /missions-local/*. Lowercase status
 * enum, flat `price` number, nullable `address` and `assignedToUserId`,
 * optional `distanceKm` (only set by the `/nearby` endpoint).
 */
export const missionResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  status: z.enum([
    "open",
    "assigned",
    "in_progress",
    "completed",
    "paid",
    "cancelled",
  ]),
  price: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
  address: z.string().nullable(),
  createdByUserId: z.string(),
  assignedToUserId: z.string().nullable(),
  distanceKm: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const missionListSchema = z.array(missionResponseSchema);

// ─── Conversations ──────────────────────────────────────────────────────────

/**
 * Canonical conversation shape from /messages-local/conversations.
 * Used by the /messages list view and the BottomNav unread badge.
 */
/**
 * Polymorphic: exactly one of `missionId` / `conversationId` is set.
 * - missionId set     → thread attached to a LocalMission (job chat)
 * - conversationId set → pure DM thread (unlocked post-swipe-match)
 * The frontend routes differently depending on which is populated.
 */
export const conversationSchema = z.object({
  missionId: z.string().nullable(),
  conversationId: z.string().nullable().optional(),
  missionTitle: z.string(),
  otherUser: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
  lastMessage: z.string().nullable(),
  lastMessageAt: z.string(),
  unreadCount: z.number(),
});

export type ConversationListItem = z.infer<typeof conversationSchema>;

export const conversationListSchema = z.array(conversationSchema);

/**
 * Shape of a message in a pure Conversation (post-match DM).
 */
export const conversationMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  senderRole: z.string(),
  content: z.string(),
  status: z.string(),
  createdAt: z.string(),
});

export type ConversationMessage = z.infer<typeof conversationMessageSchema>;

export const conversationMessagesResponseSchema = z.object({
  messages: z.array(conversationMessageSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

// ─── Stripe Connect status ──────────────────────────────────────────────────

/**
 * Canonical response shape for /payments/stripe/connect/status.
 * Gates the StripeConnectGate banner across 3 worker surfaces.
 */
export const stripeConnectStatusSchema = z.object({
  onboarded: z.boolean(),
  chargesEnabled: z.boolean(),
  payoutsEnabled: z.boolean(),
  requirementsNeeded: z.array(z.string()),
});

export type StripeConnectStatus = z.infer<typeof stripeConnectStatusSchema>;

// ─── Subscriptions (Phase 1 monetization) ───────────────────────────────────

export const SUBSCRIPTION_PLANS = [
  "FREE",
  "PRO",              // legacy, not sold
  "PREMIUM",          // legacy, not sold
  "CLIENT_PRO",
  "WORKER_PRO",
  "CLIENT_BUSINESS",
] as const;

export const subscriptionSchema = z.object({
  id: z.string().optional(),
  plan: z.enum(SUBSCRIPTION_PLANS),
  status: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  stripeSubscriptionId: z.string().optional(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

export const checkoutSessionSchema = z.object({
  url: z.string().url(),
  sessionId: z.string(),
});

export const missionsQuotaSchema = z.object({
  used: z.number(),
  limit: z.number().nullable(),
  hasPaidPlan: z.boolean(),
});

export type MissionsQuota = z.infer<typeof missionsQuotaSchema>;

// ─── Parser helper ──────────────────────────────────────────────────────────

/**
 * Wrap an `apiFetch` result in a schema parse. On mismatch, throws
 * a clear `Error` with the Zod path so the ErrorBoundary + Sentry
 * can surface it instead of the app crashing deep in a component.
 *
 * Usage:
 *   const raw = await apiFetch<unknown>("/users/me");
 *   const profile = parseResponse(userMeSchema, raw, "GET /users/me");
 */
export function parseResponse<T>(
  schema: z.ZodType<T>,
  raw: unknown,
  source: string,
): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Réponse backend invalide (${source}): ${issues}`,
    );
  }
  return result.data;
}
