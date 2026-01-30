"use client";

/**
 * Consent Provider - WorkOn
 *
 * Provider global pour la gestion du consentement légal.
 * Affiche le modal bloquant si le consentement est manquant.
 *
 * IMPORTANT:
 * - Vérifie le consentement à chaque changement d'auth
 * - Bloque toute navigation sans consentement valide
 * - Pas de bypass possible
 *
 * Conformité: Loi 25 Québec, GDPR, Apple App Store, Google Play
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConsentModal } from "./consent-modal";
import {
  getConsentStatus,
  acceptAllDocuments,
  type ConsentStatus,
} from "@/lib/compliance-api";

type PendingAction = {
  execute: () => Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
};

type ConsentContextType = {
  isConsentComplete: boolean;
  isLoading: boolean;
  missingDocuments: string[];
  refreshConsentStatus: () => Promise<void>;
  /**
   * Trigger the consent modal from API error handler.
   * Returns a promise that resolves when consent is accepted,
   * allowing the caller to retry the failed action.
   */
  requireConsent: () => Promise<void>;
};

const ConsentContext = createContext<ConsentContextType>({
  isConsentComplete: false,
  isLoading: true,
  missingDocuments: [],
  refreshConsentStatus: async () => {},
  requireConsent: async () => {},
});

export function useConsent() {
  return useContext(ConsentContext);
}

type ConsentProviderProps = {
  children: React.ReactNode;
};

export function ConsentProvider({ children }: ConsentProviderProps) {
  const { isSignedIn, getToken, isLoaded } = useAuth();

  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Queue of pending actions waiting for consent
  const pendingActionsRef = useRef<PendingAction[]>([]);

  /**
   * Vérifier le statut de consentement
   */
  const checkConsentStatus = useCallback(async () => {
    if (!isSignedIn) {
      setConsentStatus(null);
      setIsLoading(false);
      setShowModal(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const status = await getConsentStatus(token);
      setConsentStatus(status);

      // Afficher le modal si consentement incomplet
      if (!status.isComplete) {
        setShowModal(true);
      } else {
        setShowModal(false);
      }
    } catch (error) {
      console.error("[ConsentProvider] Erreur vérification consentement:", error);
      // En cas d'erreur, on ne bloque pas (fail-open pour UX)
      // Le backend bloquera de toute façon les requêtes critiques
      setConsentStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  /**
   * Rafraîchir le statut de consentement (exposé via context)
   */
  const refreshConsentStatus = useCallback(async () => {
    setIsLoading(true);
    await checkConsentStatus();
  }, [checkConsentStatus]);

  /**
   * Accepter tous les documents
   */
  const handleAccept = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      throw new Error("Non authentifié");
    }

    const result = await acceptAllDocuments(token);

    if (result.success) {
      // Rafraîchir le statut
      await checkConsentStatus();

      // Résoudre toutes les actions en attente
      const pending = pendingActionsRef.current;
      pendingActionsRef.current = [];
      pending.forEach((action) => action.resolve());
    } else {
      // Rejeter toutes les actions en attente
      const pending = pendingActionsRef.current;
      pendingActionsRef.current = [];
      pending.forEach((action) =>
        action.reject(new Error("Consentement non accepté"))
      );
      throw new Error("Impossible d'enregistrer votre consentement");
    }
  }, [getToken, checkConsentStatus]);

  /**
   * Déclencher le modal de consentement depuis un gestionnaire d'erreur API.
   * Retourne une promesse qui se résout quand le consentement est accepté.
   */
  const requireConsent = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Ajouter à la file d'attente
      pendingActionsRef.current.push({
        execute: async () => {},
        resolve,
        reject,
      });

      // Afficher le modal
      setShowModal(true);
    });
  }, []);

  // Vérifier le consentement au chargement et quand l'auth change
  useEffect(() => {
    if (isLoaded) {
      checkConsentStatus();
    }
  }, [isLoaded, isSignedIn, checkConsentStatus]);

  const isConsentComplete = consentStatus?.isComplete ?? false;
  const missingDocuments = consentStatus?.missing ?? [];

  return (
    <ConsentContext.Provider
      value={{
        isConsentComplete,
        isLoading,
        missingDocuments,
        refreshConsentStatus,
        requireConsent,
      }}
    >
      {children}

      {/* Modal de consentement bloquant */}
      <ConsentModal
        isOpen={showModal && isSignedIn === true}
        onAccept={handleAccept}
        missingDocuments={missingDocuments}
        isLoading={isLoading}
      />
    </ConsentContext.Provider>
  );
}

