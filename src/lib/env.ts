import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PLATFORM_FEE_PCT: z.string().default("10"),
  
  // Mapbox
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
  
  // Storage
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // Email
  RESEND_API_KEY: z.string().optional(),
  
  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  
  // Error Tracking
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3001/api/v1"),
  
  // Feature Flags
  NEXT_PUBLIC_FEATURE_FREE_TIER_LIMITS: z.string().default("true"),
  NEXT_PUBLIC_FEATURE_MATCHING_ENGINE: z.string().default("true"),
  NEXT_PUBLIC_FEATURE_CRM: z.string().default("true"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map((e) => e.path.join(".")).join(", ");
      throw new Error(
        `❌ Variables d'environnement manquantes ou invalides: ${missing}\n\n` +
        `Veuillez créer un fichier .env.local avec les valeurs requises.\n` +
        `Consultez .env.example pour la liste complète.`
      );
    }
    throw error;
  }
}

export const env = validateEnv();

