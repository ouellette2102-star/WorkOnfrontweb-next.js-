"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { X, Search, FileText, Briefcase, Send, Users, CheckCircle } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "workon_wizard_dismissed";

const WORKER_STEPS = [
  {
    icon: Search,
    title: "Explorez",
    description: "Parcourez les missions disponibles pres de chez vous et trouvez celles qui correspondent a vos competences.",
  },
  {
    icon: Send,
    title: "Proposez",
    description: "Envoyez votre offre avec un prix competitif et un message personnalise pour vous demarquer.",
  },
  {
    icon: Briefcase,
    title: "Travaillez",
    description: "Completez la mission, recevez votre paiement securise et construisez votre reputation.",
  },
];

const EMPLOYER_STEPS = [
  {
    icon: FileText,
    title: "Publiez",
    description: "Creez une mission avec une description claire, un budget et votre localisation.",
  },
  {
    icon: Users,
    title: "Recevez des offres",
    description: "Les travailleurs qualifies vous enverront leurs propositions. Comparez les profils et avis.",
  },
  {
    icon: CheckCircle,
    title: "Choisissez",
    description: "Selectionnez le meilleur candidat, suivez la mission et payez en toute securite.",
  },
];

export function FirstMissionWizard() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
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
          {isWorker ? "Commencez a travailler" : "Trouvez votre travailleur"}
        </h2>
        <p className="text-sm text-gray-500">3 etapes simples pour commencer</p>
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
            Precedent
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
          <Link href={isWorker ? "/search" : "/employer"}>
            <Button onClick={handleDismiss} className="bg-red-600 hover:bg-red-500">
              {isWorker ? "Voir les missions" : "Creer une mission"}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
