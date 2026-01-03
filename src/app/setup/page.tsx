import { getEnvStatus, getMissingRequiredVars, isClerkConfigured } from "@/lib/env";
import Link from "next/link";

export const metadata = {
  title: "Configuration - WorkOn",
  description: "Configuration de l'environnement WorkOn",
};

/**
 * Setup Page - Shows environment configuration status
 * 
 * This page is shown when:
 * - Required environment variables are missing
 * - User navigates directly to /setup
 * 
 * SECURITY: Never shows actual values, only present/absent status
 */
export default function SetupPage() {
  const envStatus = getEnvStatus();
  const missingRequired = getMissingRequiredVars();
  const clerkConfigured = isClerkConfigured();
  
  const requiredVars = envStatus.filter((v) => v.required);
  const optionalVars = envStatus.filter((v) => !v.required);
  
  const isConfigValid = missingRequired.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-4">
            <svg
              className="h-8 w-8 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Configuration WorkOn
          </h1>
          <p className="text-white/60">
            {isConfigValid
              ? "Votre environnement est correctement configuré."
              : "Certaines variables d'environnement sont manquantes."}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-8">
          {isConfigValid ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/30 px-4 py-2 text-sm font-medium text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Configuration valide
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Configuration incomplète
            </span>
          )}
        </div>

        {/* Required Variables */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-red-400">*</span>
            Variables requises
          </h2>
          <div className="space-y-3">
            {requiredVars.map((v) => (
              <div
                key={v.name}
                className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
              >
                <code className="text-sm text-white/80 font-mono">{v.name}</code>
                {v.present ? (
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Présent
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-red-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Manquant
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Optional Variables (collapsed by default) */}
        <details className="rounded-2xl border border-white/10 bg-black/40 p-6 mb-8">
          <summary className="text-lg font-semibold text-white cursor-pointer">
            Variables optionnelles ({optionalVars.filter((v) => v.present).length}/{optionalVars.length} configurées)
          </summary>
          <div className="mt-4 space-y-2">
            {optionalVars.map((v) => (
              <div
                key={v.name}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
              >
                <code className="text-white/60 font-mono text-xs">{v.name}</code>
                {v.present ? (
                  <span className="text-green-400/60 text-xs">✓</span>
                ) : (
                  <span className="text-white/30 text-xs">—</span>
                )}
              </div>
            ))}
          </div>
        </details>

        {/* Instructions */}
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">
            Instructions de configuration
          </h3>
          <ol className="space-y-3 text-sm text-white/70">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                1
              </span>
              <span>
                Copiez le fichier <code className="text-yellow-400">.env.example</code> vers{" "}
                <code className="text-yellow-400">.env.local</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                2
              </span>
              <span>
                Créez un compte sur{" "}
                <a
                  href="https://dashboard.clerk.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 underline"
                >
                  Clerk Dashboard
                </a>{" "}
                et récupérez vos clés API
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                3
              </span>
              <span>
                Remplissez les valeurs dans <code className="text-yellow-400">.env.local</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                4
              </span>
              <span>Redémarrez le serveur de développement</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isConfigValid && (
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              Aller à l&apos;application →
            </Link>
          )}
          <a
            href="https://dashboard.clerk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            Ouvrir Clerk Dashboard
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-white/40">
          <p>WorkOn — Marketplace de services</p>
          <p className="mt-1">
            Cette page ne contient aucune donnée sensible.
          </p>
        </div>
      </div>
    </div>
  );
}

