"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";
import { Wrench, Briefcase, CheckCircle2, ChevronRight, Shield, Lock } from "lucide-react";
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

function RegisterInner() {
  const { register: authRegister, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read ?role=worker|employer from URL — hero CTAs pre-select this so
  // we can skip step 2 entirely and reduce the funnel from 4 to 3 steps.
  const presetRoleParam = searchParams.get("role");
  const presetRole: UserRole | null =
    presetRoleParam === "worker" || presetRoleParam === "employer"
      ? (presetRoleParam as UserRole)
      : null;

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>(presetRole ?? "worker");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Step1Data | null>(null);

  const step1Form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const step3Form = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  // Step 1: Email + Password
  async function onStep1(data: Step1Data) {
    setCredentials(data);
    // If role was pre-selected from the URL, jump past step 2.
    setStep(presetRole ? 3 : 2);
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

      // Auto-accept terms + privacy (non-blocking)
      try {
        const versions = await api.getConsentVersions();
        if (versions.versions.TERMS) {
          await api.acceptDocument("TERMS", versions.versions.TERMS);
        }
        if (versions.versions.PRIVACY) {
          await api.acceptDocument("PRIVACY", versions.versions.PRIVACY);
        }
      } catch (err) {
        console.warn("[register] consent auto-accept failed", err);
      }

      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  }

  // Keep 'back' smart: if we skipped step 2 via preset role, go straight
  // back to step 1 instead of dropping the user on a step they never saw.
  const backFromStep3 = () => setStep(presetRole ? 1 : 2);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-10 bg-gradient-to-b from-neutral-900 via-background to-background">
      {/* Logo */}
      <div className="mb-8 text-white">
        <WorkOnWordmark size="xl" />
      </div>

      <div className="w-full max-w-sm">
        {/* Step 1: Credentials */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Créez votre compte</h1>
              <p className="text-workon-muted text-sm mt-2">
                {presetRole === "worker"
                  ? "Rejoignez WorkOn et commencez à recevoir des missions près de chez vous."
                  : presetRole === "employer"
                    ? "Rejoignez WorkOn et publiez votre première mission en quelques minutes."
                    : "Inscrivez-vous et commencez à offrir ou trouver des talents à la demande."}
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
                  <p className="text-workon-accent text-xs">
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
                  <p className="text-workon-accent text-xs">
                    {step1Form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" variant="hero" size="hero" className="w-full">
                Continuer
              </Button>
            </form>

            {/* Trust strip — reduces email+password anxiety */}
            <div className="rounded-2xl border border-workon-border bg-workon-bg p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-workon-muted">
                <Lock className="h-3.5 w-3.5 text-[#22C55E]" />
                <span>Vos données sont chiffrées et jamais revendues</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-workon-muted">
                <Shield className="h-3.5 w-3.5 text-[#22C55E]" />
                <span>Conformité Loi 25 &middot; Hébergement canadien</span>
              </div>
            </div>

            <p className="text-center text-sm text-workon-muted">
              Déjà un compte?{" "}
              <Link href="/login" className="text-workon-accent font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Choose role (skipped entirely when presetRole is set) */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Choisissez votre type de compte</h1>
              <p className="text-workon-muted text-sm mt-2">
                Faites-nous savoir comment vous souhaitez utiliser WorkOn.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => selectRole("worker")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-workon-border bg-white hover:border-[#FF4D1C]/40 hover:bg-neutral-700/80 transition-all text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF4D1C]/15 border border-[#FF4D1C]/25">
                  <Wrench className="h-6 w-6 text-workon-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Trouver des missions</p>
                  <p className="text-sm text-workon-muted">
                    Recevoir des contrats, offrir vos services
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-workon-muted" />
              </button>

              <button
                onClick={() => selectRole("employer")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-workon-border bg-white hover:border-[#FF4D1C]/40 hover:bg-neutral-700/80 transition-all text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF4D1C]/15 border border-[#FF4D1C]/25">
                  <Briefcase className="h-6 w-6 text-workon-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Publier des missions</p>
                  <p className="text-sm text-workon-muted">
                    Engager des professionnels qualifiés
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-workon-muted" />
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {["Vérification d'identité (tiers VERIFIED+)", "Paiement sécurisé par Stripe", "Contrat de service généré automatiquement"].map((text) => (
                <div key={text} className="flex items-center gap-2 text-sm text-workon-muted">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full text-center text-sm text-workon-muted hover:text-workon-muted"
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
              <p className="text-workon-muted text-sm mt-2">
                Quelques infos pour finaliser votre compte.
                {role === "worker"
                  ? " Vous pourrez compléter plus tard."
                  : " Vous pouvez compléter plus tard."}
              </p>
            </div>

            <form onSubmit={step3Form.handleSubmit(onStep3)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" placeholder="Prénom" {...step3Form.register("firstName")} />
                  {step3Form.formState.errors.firstName && (
                    <p className="text-workon-accent text-xs">{step3Form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" placeholder="Nom" {...step3Form.register("lastName")} />
                  {step3Form.formState.errors.lastName && (
                    <p className="text-workon-accent text-xs">{step3Form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  Téléphone <span className="text-workon-muted text-xs font-normal">(facultatif)</span>
                </Label>
                <Input id="phone" type="tel" placeholder="514-555-0000" {...step3Form.register("phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  Ville <span className="text-workon-muted text-xs font-normal">(facultatif)</span>
                </Label>
                <Input id="city" placeholder="Montréal" {...step3Form.register("city")} />
              </div>

              {error && (
                <p className="text-workon-accent text-sm text-center bg-[#FF4D1C]/10 border border-[#FF4D1C]/25 rounded-xl p-3">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="hero"
                size="hero"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Inscription..." : "Finaliser mon inscription"}
              </Button>
            </form>

            <button
              onClick={backFromStep3}
              className="w-full text-center text-sm text-workon-muted hover:text-workon-muted"
            >
              ← Retour
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && user && (
          <div className="space-y-6 text-center">
            <h1 className="text-2xl font-bold">Votre profil est prêt !</h1>
            <p className="text-workon-muted text-sm">
              {role === "worker"
                ? "Commencez à recevoir des demandes de missions."
                : "Publiez votre première mission dès maintenant."}
            </p>

            <div className="rounded-3xl border border-workon-border bg-white backdrop-blur-sm p-6 space-y-3 shadow-sm">
              <div className="mx-auto h-16 w-16 rounded-full bg-[#FF4D1C]/20 border border-[#FF4D1C]/30 flex items-center justify-center text-2xl font-bold text-workon-accent">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <p className="font-semibold text-lg">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-workon-muted capitalize">{user.role}</p>
              {user.city && <p className="text-sm text-workon-muted">📍 {user.city}</p>}
            </div>

            <Button
              onClick={() => router.push("/home")}
              variant="hero"
              size="hero"
              className="w-full"
            >
              Commencer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
