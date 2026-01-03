"use client";

import { useState } from "react";

/**
 * Page de test pour l'Error Boundary
 * 
 * ⚠️ ROUTE DE TEST UNIQUEMENT - À SUPPRIMER AVANT MERGE EN PRODUCTION
 * 
 * Usage:
 * 1. Accéder à /debug/error-test
 * 2. Cliquer sur "Déclencher une erreur"
 * 3. Vérifier que l'error boundary s'affiche
 * 4. Tester le bouton "Réessayer"
 */
export default function ErrorTestPage() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error("Erreur de test déclenchée manuellement pour tester l'Error Boundary");
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-yellow-400 text-sm font-medium">
            ⚠️ Page de test uniquement
          </p>
          <p className="text-yellow-400/70 text-xs mt-1">
            À supprimer avant merge en production
          </p>
        </div>

        <h1 className="text-2xl font-bold text-white">
          Test Error Boundary
        </h1>
        
        <p className="text-white/60 text-sm">
          Cliquez sur le bouton ci-dessous pour déclencher une erreur 
          et tester l&apos;affichage de l&apos;Error Boundary.
        </p>

        <button
          onClick={() => setShouldError(true)}
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
        >
          Déclencher une erreur
        </button>

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-white/40">
            Après le crash, vous devriez voir:
          </p>
          <ul className="text-xs text-white/40 mt-2 space-y-1">
            <li>✓ Message d&apos;erreur clair</li>
            <li>✓ Bouton &quot;Réessayer&quot;</li>
            <li>✓ Lien &quot;Retour à l&apos;accueil&quot;</li>
            <li>✓ En dev: détails de l&apos;erreur</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

