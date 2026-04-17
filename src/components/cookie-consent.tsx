"use client";

/**
 * Cookie Consent Banner - WorkOn
 *
 * Banniere de consentement aux cookies conforme a la Loi 25 du Quebec.
 * Affichee pour tous les visiteurs (authentifies ou non).
 * Le choix est persiste dans localStorage sous la cle "cookie-consent".
 *
 * Valeurs possibles:
 * - "accepted" : tous les cookies acceptes
 * - "refused"  : seuls les cookies essentiels
 * - absent     : pas encore de choix -> afficher la banniere
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { safeLocalStorage } from "@/lib/safe-storage";

const STORAGE_KEY = "cookie-consent";

type ConsentValue = "accepted" | "refused";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner only if no choice has been recorded yet
    const stored = safeLocalStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const handleChoice = (value: ConsentValue) => {
    safeLocalStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6"
    >
      <div
        className="mx-auto max-w-3xl rounded-2xl border shadow-2xl px-6 py-5 sm:px-8 sm:py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6"
        style={{
          backgroundColor: "var(--workon-bg, #F9F8F5)",
          borderColor: "var(--workon-border, #E5E0D8)",
          color: "var(--workon-ink, #1A1A1A)",
        }}
      >
        {/* Text */}
        <div className="flex-1 text-sm leading-relaxed">
          <p>
            Ce site utilise des cookies essentiels au fonctionnement et, avec
            votre accord, des cookies analytiques pour ameliorer votre
            experience. Conformement a la{" "}
            <strong>Loi 25 sur la protection des renseignements personnels</strong>
            , vous pouvez accepter ou refuser les cookies non essentiels.
          </p>
          <p className="mt-2">
            <Link
              href="/legal/privacy"
              className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity"
              style={{ color: "var(--workon-primary, #134021)" }}
            >
              Politique de confidentialite
            </Link>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 shrink-0">
          <button
            onClick={() => handleChoice("refused")}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80 cursor-pointer"
            style={{
              borderColor: "var(--workon-border, #E5E0D8)",
              color: "var(--workon-muted, #8C8577)",
            }}
          >
            Refuser les non-essentiels
          </button>
          <button
            onClick={() => handleChoice("accepted")}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 cursor-pointer"
            style={{
              backgroundColor: "var(--workon-primary, #134021)",
            }}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
