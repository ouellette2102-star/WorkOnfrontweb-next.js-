"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken, refreshToken } from "@/lib/auth";
import { safeLocalStorage } from "@/lib/safe-storage";
import { ConsentModal } from "./consent-modal";
import {
  acceptAllDocuments,
  getActiveVersions,
  getConsentStatus,
  isLegalDocumentType,
  normalizeLegalVersions,
  REQUIRED_LEGAL_DOCUMENTS,
  type ConsentStatus,
  type LegalDocumentType,
  type LegalVersions,
} from "@/lib/compliance-api";

type PendingAction = {
  resolve: () => void;
  reject: (error: Error) => void;
};

type ConsentContextType = {
  isConsentComplete: boolean;
  isLoading: boolean;
  missingDocuments: string[];
  refreshConsentStatus: () => Promise<void>;
  /**
   * Trigger the consent modal from API error handling.
   * Resolves only after backend /compliance/status confirms completion.
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

function incompleteConsentStatus(missing = REQUIRED_LEGAL_DOCUMENTS): ConsentStatus {
  return {
    isComplete: false,
    documents: {},
    missing: [...missing],
  };
}

function toLegalDocuments(missingDocuments: string[]): LegalDocumentType[] {
  const documents = missingDocuments.filter(isLegalDocumentType);
  return documents.length > 0 ? documents : [...REQUIRED_LEGAL_DOCUMENTS];
}

function rejectPendingActions(actions: React.MutableRefObject<PendingAction[]>, error: Error) {
  const pending = actions.current;
  actions.current = [];
  pending.forEach((action) => action.reject(error));
}

function resolvePendingActions(actions: React.MutableRefObject<PendingAction[]>) {
  const pending = actions.current;
  actions.current = [];
  pending.forEach((action) => action.resolve());
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [activeVersions, setActiveVersions] = useState<LegalVersions>(
    normalizeLegalVersions(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const pendingActionsRef = useRef<PendingAction[]>([]);

  const checkConsentStatus = useCallback(async (): Promise<ConsentStatus | null> => {
    if (!isAuthenticated) {
      setConsentStatus(null);
      setStatusError(null);
      setIsLoading(false);
      setShowModal(false);
      return null;
    }

    const token = getAccessToken();
    if (!token) {
      const fallback = incompleteConsentStatus();
      setConsentStatus(fallback);
      // Distinguish a blocked-storage browser (in-app WebView / private mode)
      // from a plain expired session. In the first case localStorage silently
      // returns null for everything, so "reconnecte-toi" would loop forever —
      // the user must open WorkOn in a real browser instead.
      setStatusError(
        safeLocalStorage.isAvailable()
          ? "Session expiree: reconnecte-toi pour accepter les conditions."
          : "Ton navigateur bloque le stockage local. Ouvre WorkOn directement dans Safari ou Chrome (pas dans l'app Facebook/Instagram/Messenger ni un apercu d'email).",
      );
      setIsLoading(false);
      setShowModal(true);
      return fallback;
    }

    const versionsPromise = getActiveVersions()
      .then((result) => {
        setActiveVersions(result.versions);
        return result.versions;
      })
      .catch((error) => {
        console.warn("[ConsentProvider] active versions unavailable:", error);
        return null;
      });

    try {
      const status = await getConsentStatus(token);
      await versionsPromise;

      setConsentStatus(status);
      setStatusError(null);
      setShowModal(!status.isComplete);
      return status;
    } catch (error) {
      console.error("[ConsentProvider] consent status check failed:", error);
      await versionsPromise;

      const fallback = incompleteConsentStatus();
      setConsentStatus(fallback);
      setStatusError(
        "Impossible de verifier le consentement. WorkOn bloque les actions critiques jusqu'a confirmation.",
      );
      setShowModal(true);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshConsentStatus = useCallback(async () => {
    setIsLoading(true);
    await checkConsentStatus();
  }, [checkConsentStatus]);

  const handleAccept = useCallback(async () => {
    setIsLoading(true);
    try {
      // The access token lives in localStorage and is short-lived (15 min).
      // On iOS Safari (ITP) / in-app WebViews it can be missing by the time
      // the user clicks accept — typically after reading the legal docs in a
      // new tab while the token expires. DON'T dead-end here: attempt a
      // cookie-based refresh first. If that also fails, refreshToken() emits
      // `workon:session-expired`, which AuthProvider turns into a redirect to
      // /login — a recovery path instead of a permanently stuck modal.
      let token = getAccessToken();
      if (!token) {
        token = await refreshToken();
      }
      if (!token) {
        const error = new Error(
          "Session expiree. Reconnecte-toi pour accepter les conditions.",
        );
        rejectPendingActions(pendingActionsRef, error);
        throw error;
      }

      const documentsToAccept = toLegalDocuments(consentStatus?.missing ?? []);

      const result = await acceptAllDocuments(token, documentsToAccept);
      if (!result.success) {
        const error = new Error("Impossible d'enregistrer votre consentement");
        rejectPendingActions(pendingActionsRef, error);
        throw error;
      }

      const confirmedStatus = await checkConsentStatus();
      if (!confirmedStatus?.isComplete) {
        const error = new Error(
          "Consentement envoye, mais le statut n'est pas encore confirme.",
        );
        rejectPendingActions(pendingActionsRef, error);
        throw error;
      }

      resolvePendingActions(pendingActionsRef);
    } finally {
      // Never leave the modal's button stuck on a permanent spinner, even if
      // a network/auth step threw above.
      setIsLoading(false);
    }
  }, [checkConsentStatus, consentStatus?.missing]);

  const requireConsent = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      pendingActionsRef.current.push({ resolve, reject });
      setShowModal(true);
    });
  }, []);

  useEffect(() => {
    if (!authLoading) {
      void checkConsentStatus();
    }
  }, [authLoading, isAuthenticated, checkConsentStatus]);

  const isConsentComplete = consentStatus?.isComplete ?? false;
  const missingDocuments =
    consentStatus?.missing.length ? consentStatus.missing : showModal ? [...REQUIRED_LEGAL_DOCUMENTS] : [];

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

      <ConsentModal
        isOpen={showModal && isAuthenticated === true}
        onAccept={handleAccept}
        missingDocuments={missingDocuments}
        versions={activeVersions}
        statusError={statusError}
        isLoading={isLoading}
      />
    </ConsentContext.Provider>
  );
}

