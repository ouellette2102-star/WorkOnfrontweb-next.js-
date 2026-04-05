"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Wrench, Briefcase, CheckCircle2, ChevronRight } from "lucide-react";
import type { UserRole } from "@/lib/auth";

// Step schemas
const step1Schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
});

const step3Schema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phone: z.string().optional(),
  city: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export default function RegisterPage() {
  const { register: authRegister, user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>("worker");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Step1Data | null>(null);

  const step1Form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const step3Form = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  // Step 1: Email + Password
  async function onStep1(data: Step1Data) {
    setCredentials(data);
    setStep(2);
  }

  // Step 2: Choose role
  function selectRole(r: UserRole) {
    setRole(r);
    setStep(3);
  }

  // Step 3: Profile details → register
  async function onStep3(data: Step3Data) {
    if (!credentials) return;
    setError("");
    setLoading(true);
    try {
      await authRegister({
        email: credentials.email,
        password: credentials.password,
        role,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        city: data.city,
      });

      // Auto-accept terms + privacy
      try {
        const versions = await api.getConsentVersions();
        if (versions.versions.TERMS) {
          await api.acceptDocument("TERMS", versions.versions.TERMS);
        }
        if (versions.versions.PRIVACY) {
          await api.acceptDocument("PRIVACY", versions.versions.PRIVACY);
        }
      } catch {
        // Non-blocking — consent can be done later
      }

      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-neutral-900 via-background to-background">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-1 text-3xl font-bold">
        <span>Work</span>
        <MapPin className="h-7 w-7 text-red-accent" />
        <span>n</span>
      </div>

      <div className="w-full max-w-sm">
        {/* Step 1: Credentials */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">
                Rejoignez la communauté Work
                <span className="text-red-accent">O</span>n
              </h1>
              <p className="text-white/60 text-sm mt-2">
                Inscrivez-vous et commencez à offrir ou trouver des talents à la
                demande, partout, en toute confiance.
              </p>
            </div>

            <form onSubmit={step1Form.handleSubmit(onStep1)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  autoComplete="email"
                  {...step1Form.register("email")}
                />
                {step1Form.formState.errors.email && (
                  <p className="text-red-400 text-xs">
                    {step1Form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                  {...step1Form.register("password")}
                />
                {step1Form.formState.errors.password && (
                  <p className="text-red-400 text-xs">
                    {step1Form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full h-12 text-base">
                Commencer
              </Button>
            </form>

            <p className="text-center text-sm text-white/60">
              Déjà un compte?{" "}
              <Link href="/login" className="text-red-accent font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Choose role */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Choisissez votre type de compte</h1>
              <p className="text-white/60 text-sm mt-2">
                Faites-nous savoir comment vous souhaitez utiliser WorkOn.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => selectRole("worker")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20">
                  <Wrench className="h-6 w-6 text-red-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Trouver des missions</p>
                  <p className="text-sm text-white/60">
                    Recevoir des contrats, offrir vos services
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/40" />
              </button>

              <button
                onClick={() => selectRole("employer")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20">
                  <Briefcase className="h-6 w-6 text-red-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Publier des missions</p>
                  <p className="text-sm text-white/60">
                    Engager des professionnels qualifiés
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/40" />
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {["Vérification d'identité", "Assurances & conformité", "Contrat sécurisé WorkOn"].map((text) => (
                <div key={text} className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full text-center text-sm text-white/50 hover:text-white/70"
            >
              ← Retour
            </button>
          </div>
        )}

        {/* Step 3: Profile details */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Créez votre profil</h1>
              <p className="text-white/60 text-sm mt-2">
                Complétez votre profil pour commencer à{" "}
                {role === "worker" ? "recevoir" : "publier"} des missions.
              </p>
            </div>

            <form onSubmit={step3Form.handleSubmit(onStep3)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" placeholder="Prénom" {...step3Form.register("firstName")} />
                {step3Form.formState.errors.firstName && (
                  <p className="text-red-400 text-xs">{step3Form.formState.errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" placeholder="Nom" {...step3Form.register("lastName")} />
                {step3Form.formState.errors.lastName && (
                  <p className="text-red-400 text-xs">{step3Form.formState.errors.lastName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" placeholder="514-555-0000" {...step3Form.register("phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" placeholder="Montréal" {...step3Form.register("city")} />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? "Inscription..." : "Finaliser mon inscription"}
              </Button>
            </form>

            <button
              onClick={() => setStep(2)}
              className="w-full text-center text-sm text-white/50 hover:text-white/70"
            >
              ← Retour
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && user && (
          <div className="space-y-6 text-center">
            <h1 className="text-2xl font-bold">Votre profil est prêt!</h1>
            <p className="text-white/60 text-sm">
              Partagez votre lien unique et commencez à{" "}
              {role === "worker" ? "recevoir des demandes de contrats" : "publier des missions"}.
            </p>

            <div className="rounded-xl border border-white/10 bg-neutral-800/80 p-6 space-y-3">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-600/20 flex items-center justify-center text-2xl font-bold text-red-accent">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <p className="font-semibold text-lg">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-white/60 capitalize">{user.role}</p>
              {user.city && <p className="text-sm text-white/60">{user.city}</p>}
            </div>

            <Button onClick={() => router.push("/home")} className="w-full h-12 text-base">
              Commencer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
