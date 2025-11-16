#!/usr/bin/env tsx
/**
 * Script de validation de l'environnement
 * Vérifie que toutes les variables d'environnement requises sont présentes
 */

import { readFileSync } from "fs";
import { join } from "path";

const requiredEnvVars = [
  "DATABASE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];

function checkEnv() {
  console.log("🔍 Vérification de l'environnement...\n");

  const missing: string[] = [];
  const present: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    } else {
      present.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("❌ Variables manquantes:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\n💡 Créez un fichier .env.local avec ces variables.");
    console.error("   Consultez .env.example pour les valeurs attendues.\n");
    process.exit(1);
  }

  console.log("✅ Toutes les variables requises sont présentes:\n");
  present.forEach((key) => {
    const value = process.env[key];
    const masked = key.includes("SECRET") || key.includes("KEY")
      ? `${value?.substring(0, 8)}...`
      : value;
    console.log(`   ✓ ${key}: ${masked}`);
  });

  console.log("\n🎉 Configuration valide!");
}

checkEnv();

