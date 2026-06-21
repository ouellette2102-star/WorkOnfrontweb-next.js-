"use client";

import { useState, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { X, Search, FileText, Briefcase, Send, Users, CheckCircle } from "lucide-react";
import Link from "next/link";
import { safeLocalStorage } from "@/lib/safe-storage";

const STORAGE_KEY = "workon_wizard_dismissed";
const subscribeNoop = () => () => {};
const getStoredDismissed = () => Boolean(safeLocalStorage.getItem(STORAGE_KEY));
const getServerDismissed = () => true;

const WORKER_STEPS = [
  {
    icon: Search,
    title: "Explorez",
    description: "Parcourez les missions disponibles près de chez vous et trouvez celles qui correspondent à vos compétences.",
  },
  {
    icon: Send,
    title: "Proposez",
    description: "Envoyez votre offre avec un prix compétitif et un message personnalisé pour vous démarquer.",
  },
  {
    icon: Briefcase,
    title: "Travaillez",
    description: "Complétez la mission, recevez votre paiement sécurisé et construisez votre réputation.",
  },
];

const EMPLOYER_STEPS = [
  {
    icon: FileText,
    title: "Publiez",
    description: "Créez une mission avec une description claire, un budget et votre localisation.",
  },
  {
    icon: Users,
    title: "Recevez des offres",
    description: "Les travailleurs qualifiés vous enverront leurs propositions. Comparez les profils et avis.",
  },
  {
    icon: CheckCircle,
    title: "Choisissez",
    description: "Sélectionnez le meilleur candidat, suivez la mission et payez en toute sécurité.",
  },
];

export function FirstMissionWizard() {
  const { user } = useAuth();
  const storedDismissed = useSyncExternalStore(
    subscribeNoop,
    getStoredDismissed,
    getServerDismissed,
  );
  const [dismissedOverride, setDismissedOverride] = useState<boolean | null>(null);
  const dismissed = dismissedOverride ?? storedDismissed;
  const [currentStep, setCurrentStep] = useState(0);

  const handleDismiss = () => {
    safeLocalStorage.setItem(STORAGE_KEY, "true");
    setDismissedOverride(true);
  };

  if (dismissed || !user) return null;

  const isWorker = user.role === "worker";
  const steps = isWorker ? WORKER_STEPS : EMPLOYER_STEPS;
  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-orange-50 p-6">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 text-gray-400 hover:text-gray-900"
        aria-label="Fermer"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mb-4 text-center">
        <h2 className="mb-1 text-lg font-bold text-gray-900">
          {isWorker ? "Commencez à travailler" : "Trouvez votre travailleur"}
        </h2>
        <p className="text-sm text-gray-500">3 étapes simples pour commencer</p>
      </div>

      {/* Step indicators */}
      <div className="mb-6 flex justify-center gap-2">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentStep ? "w-8 bg-red-500" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Current step */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20">
          <StepIcon className="h-8 w-8 text-orange-600" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900">
          {currentStep + 1}. {step.title}
        </h3>
        <p className="text-sm text-gray-500">{step.description}</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {currentStep > 0 ? (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="text-sm text-gray-400 hover:text-gray-900"
          >
            Précédent
          </button>
        ) : (
          <div />
        )}

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="bg-red-600 hover:bg-red-500"
          >
            Suivant
          </Button>
        ) : (
          <Link href={isWorker ? "/missions/mine" : "/missions/new"}>
            <Button onClick={handleDismiss} className="bg-red-600 hover:bg-red-500">
              {isWorker ? "Voir les missions" : "Créer une mission"}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
