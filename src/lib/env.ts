import { z } from "zod";

/**
 * Environment Configuration - Prod-Safe
 * 
 * Validates environment variables without crashing the app.
 * Provides clear status for each variable (present/absent).
 * SECURITY: Never logs actual values, only presence status.
 */

// Schema for validation (soft - doesn't throw)
const envSchema = z.object({
  // Clerk (REQUIRED for authentication)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  
  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  
  // Database (optional)
  DATABASE_URL: z.string().url().optional(),
  
  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PLATFORM_FEE_PCT: z.string().optional(),
  
  // Mapbox (optional)
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
  
  // Storage (optional)
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  
  // Supabase (optional)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // Email (optional)
  RESEND_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Required environment variables for the app to function
 */
export const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
] as const;

/**
 * Server-only required variables (not exposed to client)
 */
export const REQUIRED_SERVER_ENV_VARS = [
  "CLERK_SECRET_KEY",
] as const;

export type EnvVarStatus = {
  name: string;
  required: boolean;
  present: boolean;
  isServer: boolean;
};

/**
 * Get status of all environment variables (without exposing values)
 */
export function getEnvStatus(): EnvVarStatus[] {
  const allVars = [
    // Required public
    { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", required: true, isServer: false },
    // Required server
    { name: "CLERK_SECRET_KEY", required: true, isServer: true },
    // Optional public
    { name: "NEXT_PUBLIC_APP_URL", required: false, isServer: false },
    { name: "NEXT_PUBLIC_API_URL", required: false, isServer: false },
    { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", required: false, isServer: false },
    { name: "NEXT_PUBLIC_MAPBOX_TOKEN", required: false, isServer: false },
    { name: "NEXT_PUBLIC_SUPABASE_URL", required: false, isServer: false },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: false, isServer: false },
    // Optional server
    { name: "DATABASE_URL", required: false, isServer: true },
    { name: "STRIPE_SECRET_KEY", required: false, isServer: true },
    { name: "STRIPE_WEBHOOK_SECRET", required: false, isServer: true },
    { name: "UPLOADTHING_SECRET", required: false, isServer: true },
    { name: "UPLOADTHING_APP_ID", required: false, isServer: true },
    { name: "SUPABASE_SERVICE_ROLE_KEY", required: false, isServer: true },
    { name: "RESEND_API_KEY", required: false, isServer: true },
  ];

  return allVars.map((v) => ({
    ...v,
    present: typeof process.env[v.name] === "string" && process.env[v.name]!.length > 0,
  }));
}

/**
 * Check if Clerk is properly configured (keys present and valid format)
 */
export function isClerkConfigured(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Check if key exists and has valid Clerk format (pk_test_ or pk_live_)
  if (!publishableKey || publishableKey.length < 10) {
    return false;
  }
  
  // Validate format (starts with pk_test_ or pk_live_)
  if (!publishableKey.startsWith("pk_test_") && !publishableKey.startsWith("pk_live_")) {
    return false;
  }
  
  return true;
}

/**
 * Check if Clerk server key is configured
 */
export function isClerkServerConfigured(): boolean {
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  if (!secretKey || secretKey.length < 10) {
    return false;
  }
  
  // Validate format (starts with sk_test_ or sk_live_)
  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    return false;
  }
  
  return true;
}

/**
 * Get list of missing required variables
 */
export function getMissingRequiredVars(): string[] {
  const status = getEnvStatus();
  return status
    .filter((v) => v.required && !v.present)
    .map((v) => v.name);
}

/**
 * Check if all required env vars are present
 */
export function isEnvValid(): boolean {
  return getMissingRequiredVars().length === 0;
}

/**
 * Safe environment access with defaults
 */
export const env = {
  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "",
  
  // App
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  
  // Feature flags
  isClerkEnabled: isClerkConfigured(),
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};

/**
 * Log env status to console (dev only, no values)
 */
export function logEnvStatus(): void {
  if (process.env.NODE_ENV !== "development") return;
  
  const status = getEnvStatus();
  const missing = status.filter((v) => v.required && !v.present);
  
  if (missing.length > 0) {
    console.warn(
      `⚠️ [WorkOn] Missing required env vars: ${missing.map((v) => v.name).join(", ")}`
    );
    console.warn(`   → Visit /setup for configuration help`);
  }
}
