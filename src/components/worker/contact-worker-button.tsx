"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Heart, ArrowRight } from "lucide-react";

interface ContactWorkerButtonProps {
  workerId: string;
  workerFirstName: string;
  workerCategory?: string;
  workerCity?: string;
}

/**
 * Mise en relation = SWIPE-FIRST. Il n'y a pas de message direct : l'utilisateur
 * like le profil dans /swipe (Pros) ; au match mutuel, le backend crée
 * automatiquement la conversation (swipe.service.ts#ensureConversation) et le
 * chat apparaît dans /messages.
 *
 * Ce modal EXPLIQUE le modèle au lieu d'afficher un faux champ de saisie :
 * l'ancienne version montrait un textarea + "Envoyer le message" qui ne faisait
 * que rediriger vers /swipe en jetant le message tapé (UX trompeuse).
 */
export function ContactWorkerButton({
  workerId,
  workerFirstName,
  workerCategory,
}: ContactWorkerButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  const goToSwipe = () => {
    setOpen(false);
    router.push("/swipe");
  };

  // workerId reste dans le contrat du composant (réservé à un futur deep-link
  // vers la carte du pro dans /swipe).
  void workerId;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-workon-accent text-white text-sm font-medium py-2 hover:bg-workon-accent/90 transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Contacter
      </button>

      {/* Modal explicatif (swipe-first) — aucun champ de saisie */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Carte */}
          <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-workon-border bg-white p-5 shadow-xl sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-workon-ink">
                  Contacter {workerFirstName}
                </h3>
                {workerCategory && (
                  <p className="text-xs text-workon-muted">{workerCategory}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-workon-bg text-workon-muted"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Explication swipe-first */}
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-workon-accent/10 text-workon-accent">
                <Heart className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-workon-ink">
                Sur WorkOn, la mise en relation se fait par match.
              </p>
              <p className="text-sm text-workon-muted">
                Likez le profil de {workerFirstName} dans <strong>Pros</strong>.
                Dès qu&apos;il vous like en retour, votre conversation s&apos;ouvre
                automatiquement dans Messages.
              </p>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={goToSwipe}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-workon-primary py-3 text-sm font-semibold text-white transition hover:bg-workon-primary/90"
            >
              Voir dans Pros
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
