"use client";

/**
 * Consent Modal - WorkOn
 *
 * Modal bloquant pour l'acceptation des documents légaux.
 *
 * IMPORTANT:
 * - Pas de checkbox pré-cochée
 * - Pas de bypass possible
 * - Pas de fermeture sans acceptation
 *
 * Conformité: Loi 25 Québec, GDPR, Apple App Store, Google Play
 */

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, FileText, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ACTIVE_LEGAL_VERSIONS } from "@/lib/compliance-api";

type ConsentModalProps = {
  isOpen: boolean;
  onAccept: () => Promise<void>;
  missingDocuments: string[];
  isLoading?: boolean;
};

export function ConsentModal({
  isOpen,
  onAccept,
  missingDocuments,
  isLoading = false,
}: ConsentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onAccept();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue. Veuillez réessayer.",
      );
      setIsSubmitting(false);
    }
  };

  // Ne jamais permettre la fermeture sans acceptation
  const handleOpenChange = () => {
    // Intentionnellement vide - pas de fermeture possible
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg bg-white border-workon-border text-workon-ink [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>

          <DialogTitle className="text-2xl font-bold text-center">
            Acceptation requise
          </DialogTitle>

          <DialogDescription className="text-center text-workon-gray">
            Pour continuer à utiliser WorkOn, veuillez accepter nos conditions
            d&apos;utilisation et notre politique de confidentialité.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Documents à accepter */}
          <div className="space-y-3">
            {missingDocuments.includes("TERMS") && (
              <DocumentCard
                icon={<FileText className="w-5 h-5" />}
                title="Conditions d'utilisation"
                version={ACTIVE_LEGAL_VERSIONS.TERMS}
                href="/legal/terms"
              />
            )}

            {missingDocuments.includes("PRIVACY") && (
              <DocumentCard
                icon={<Shield className="w-5 h-5" />}
                title="Politique de confidentialité"
                version={ACTIVE_LEGAL_VERSIONS.PRIVACY}
                href="/legal/privacy"
              />
            )}
          </div>

          {/* Résumé */}
          <div className="p-4 bg-workon-bg rounded-lg border border-workon-border">
            <h4 className="font-medium text-workon-ink mb-2">En acceptant, vous confirmez :</h4>
            <ul className="text-sm text-workon-gray space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Avoir lu et compris les documents légaux
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Accepter les conditions d&apos;utilisation de la plateforme
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Consentir au traitement de vos données personnelles
              </li>
            </ul>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Bouton d'acceptation */}
        <div className="pt-2">
          <Button
            onClick={handleAccept}
            disabled={isSubmitting || isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-6"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "J'accepte les conditions"
            )}
          </Button>

          <p className="text-xs text-workon-muted text-center mt-4">
            Version TERMS v{ACTIVE_LEGAL_VERSIONS.TERMS} • Version PRIVACY v
            {ACTIVE_LEGAL_VERSIONS.PRIVACY}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Carte de document légal avec lien
 */
function DocumentCard({
  icon,
  title,
  version,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  version: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      className="flex items-center gap-4 p-4 bg-workon-bg hover:bg-workon-border rounded-lg border border-workon-border transition-colors group"
    >
      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-workon-ink group-hover:text-amber-600 transition-colors">
          {title}
        </p>
        <p className="text-sm text-workon-muted">Version {version}</p>
      </div>
      <span className="text-sm text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
        Lire →
      </span>
    </Link>
  );
}

