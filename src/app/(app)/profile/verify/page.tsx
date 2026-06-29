"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  IdCard,
  Loader2,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { api, type VerificationStatus } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const TIERS_ORDER: VerificationStatus["trustTier"][] = [
  "BASIC",
  "VERIFIED",
  "TRUSTED",
  "PREMIUM",
];

const TIER_CONFIG: Record<
  VerificationStatus["trustTier"],
  {
    label: string;
    eyebrow: string;
    description: string;
    accentClass: string;
    progressClass: string;
  }
> = {
  BASIC: {
    label: "Basique",
    eyebrow: "Profil actif",
    description: "Complete les signaux essentiels pour rassurer les clients.",
    accentClass: "bg-white/10 text-white ring-white/15",
    progressClass: "from-workon-primary to-workon-copper",
  },
  VERIFIED: {
    label: "Verifie",
    eyebrow: "Telephone confirme",
    description: "Ton compte a un premier signal de confiance verifie.",
    accentClass: "bg-blue-500/15 text-blue-100 ring-blue-300/20",
    progressClass: "from-blue-500 to-workon-primary",
  },
  TRUSTED: {
    label: "Fiable",
    eyebrow: "Identite confirmee",
    description: "Ton identite est confirmee pour les missions sensibles.",
    accentClass: "bg-emerald-500/15 text-emerald-100 ring-emerald-300/20",
    progressClass: "from-emerald-500 to-blue-500",
  },
  PREMIUM: {
    label: "Premium",
    eyebrow: "Confiance complete",
    description: "Telephone, identite et paiement sont prets a inspirer confiance.",
    accentClass: "bg-amber-400/15 text-amber-50 ring-amber-200/25",
    progressClass: "from-amber-400 to-emerald-500",
  },
};

const IDENTITY_STATUS: Record<
  VerificationStatus["identity"]["status"],
  { label: string; tone: StatusTone; icon: LucideIcon; detail: string }
> = {
  NOT_STARTED: {
    label: "A faire",
    tone: "neutral",
    icon: IdCard,
    detail: "Aucune session Stripe Identity n'est active.",
  },
  PENDING: {
    label: "En cours",
    tone: "warning",
    icon: Clock3,
    detail: "Verification soumise. Le resultat peut prendre quelques minutes.",
  },
  VERIFIED: {
    label: "Verifie",
    tone: "success",
    icon: ShieldCheck,
    detail: "Identite officielle confirmee.",
  },
  FAILED: {
    label: "A reprendre",
    tone: "danger",
    icon: XCircle,
    detail: "La verification a echoue. Tu peux relancer une session.",
  },
  EXPIRED: {
    label: "Expire",
    tone: "warning",
    icon: AlertCircle,
    detail: "La session a expire. Lance une nouvelle verification.",
  },
};

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
};

function normalizeMessage(message: string) {
  return message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function VerifyPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const {
    data: status,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["verification-status"],
    queryFn: () => api.getVerificationStatus(),
  });

  useEffect(() => {
    if (searchParams.get("stripe_identity") === "complete") {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      toast.success(
        "Verification soumise. Le resultat arrive sous quelques minutes.",
      );
    }
  }, [searchParams, queryClient]);

  const phoneMutation = useMutation({
    mutationFn: () => api.startPhoneVerification(),
    onSuccess: (res) => {
      if (res.devOtp) {
        setShowOtpInput(true);
        toast.success(`Code DEV: ${res.devOtp}`, { duration: 15_000 });
      } else if (res.sent) {
        setShowOtpInput(true);
        toast.success("Code de verification envoye par SMS");
      } else {
        toast.error(
          res.reason ??
            "La verification par SMS n'est pas disponible pour le moment.",
        );
      }
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Erreur";
      const normalized = normalizeMessage(msg);

      if (normalized.includes("numero") || normalized.includes("telephone")) {
        toast.error("Ajoute ton numero de telephone dans ton profil d'abord");
      } else if (normalized.includes("deja verifie")) {
        toast.info("Telephone deja verifie");
      } else {
        toast.error(`Erreur lors de l'envoi du code: ${msg}`);
      }
    },
  });

  const confirmOtpMutation = useMutation({
    mutationFn: () => api.confirmPhoneOtp(otpCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      toast.success("Telephone verifie avec succes");
      setShowOtpInput(false);
      setOtpCode("");
    },
    onError: () => toast.error("Code invalide ou expire"),
  });

  const idMutation = useMutation({
    mutationFn: () => api.startIdVerification(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      if (res.sessionUrl) {
        toast.success("Redirection vers Stripe Identity...");
        window.location.href = res.sessionUrl;
      } else {
        toast.info(
          res.message ||
            "Verification d'identite non disponible sur ce serveur.",
        );
      }
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(`Impossible de demarrer la verification: ${msg}`);
    },
  });

  const businessSignals = useMemo(
    () => [
      { label: "Nom legal", done: Boolean(user?.businessName?.trim()) },
      { label: "Categorie", done: Boolean(user?.businessCategory?.trim()) },
      {
        label: "Description",
        done: Boolean(user?.businessDescription?.trim()),
      },
      { label: "Site web", done: Boolean(user?.businessWebsite?.trim()) },
    ],
    [
      user?.businessName,
      user?.businessCategory,
      user?.businessDescription,
      user?.businessWebsite,
    ],
  );

  const businessDoneCount = businessSignals.filter((item) => item.done).length;
  const businessComplete = businessDoneCount === businessSignals.length;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-workon-bg px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
          <div className="rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-workon-primary" />
            <p className="mt-4 text-sm font-bold text-workon-ink">
              Chargement du centre de confiance
            </p>
            <p className="mt-1 text-xs text-workon-muted">
              Verification des signaux actifs.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (isError || !status) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de charger le statut de verification.";

    return (
      <main className="min-h-screen bg-workon-bg px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-bold text-workon-muted transition hover:text-workon-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au profil
          </Link>

          <section className="mt-6 rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
            <StatusPill tone="danger" icon={AlertCircle}>
              Statut indisponible
            </StatusPill>
            <h1 className="mt-5 text-3xl font-black text-workon-ink">
              On ne peut pas afficher ton centre de confiance
            </h1>
            <p className="mt-3 text-sm leading-6 text-workon-muted">
              {message}
            </p>
            <Button
              type="button"
              onClick={() => refetch()}
              className="mt-6"
              disabled={isFetching}
              data-testid="verify-error-retry"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Reessayer
            </Button>
          </section>
        </div>
      </main>
    );
  }

  const tierConfig = TIER_CONFIG[status.trustTier] ?? TIER_CONFIG.BASIC;
  const currentTierIndex = Math.max(TIERS_ORDER.indexOf(status.trustTier), 0);
  const tierProgress = Math.round(
    ((currentTierIndex + 1) / TIERS_ORDER.length) * 100,
  );
  const phoneVerified = status.phone.verified;
  const phoneDate = formatDate(status.phone.verifiedAt);
  const identityStatus = IDENTITY_STATUS[status.identity.status];
  const idVerified = status.identity.status === "VERIFIED";
  const idPending = status.identity.status === "PENDING";
  const identityDate = formatDate(status.identity.verifiedAt);
  const bankVerified = status.bank.verified;
  const bankDate = formatDate(status.bank.verifiedAt);
  const bankConnected = status.bank.hasStripeAccount;
  const completedSignals = [
    phoneVerified,
    idVerified,
    bankVerified,
    businessComplete,
  ].filter(Boolean).length;

  return (
    <main
      className="min-h-screen bg-workon-bg px-4 py-5 pb-24 sm:px-6 lg:px-8"
      data-testid="profile-verify-page"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-bold text-workon-muted transition hover:text-workon-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au profil
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="verify-refresh"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Actualiser
          </Button>
        </div>

        <section className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-7 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_420px] lg:items-stretch">
            <div className="flex flex-col justify-between gap-8 pb-20 lg:pb-0">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-white/80 ring-1 ring-white/15">
                  <Shield className="h-4 w-4 text-white" />
                  Centre de confiance
                </div>
                <h1 className="mt-6 max-w-3xl font-heading text-4xl font-black leading-tight text-white sm:text-5xl">
                  Verification d&apos;identite
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
                  Regroupe les preuves qui rassurent avant une mission:
                  telephone, identite, paiements et profil de cie. Chaque signal
                  garde son propre endroit pour rester clair et verifiable.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MetricCard
                  icon={Phone}
                  label="Telephone"
                  value={phoneVerified ? "Verifie" : "A faire"}
                  tone={phoneVerified ? "success" : "neutral"}
                  detail={phoneDate ?? user?.phone ?? "SMS requis"}
                />
                <MetricCard
                  icon={IdCard}
                  label="Identite"
                  value={identityStatus.label}
                  tone={identityStatus.tone}
                  detail={identityDate ?? identityStatus.detail}
                />
                <MetricCard
                  icon={WalletCards}
                  label="Paiements"
                  value={
                    bankVerified
                      ? "Verifie"
                      : bankConnected
                        ? "Connecte"
                        : "A relier"
                  }
                  tone={bankVerified ? "success" : bankConnected ? "info" : "neutral"}
                  detail={bankDate ?? "Stripe Connect"}
                />
                <MetricCard
                  icon={BriefcaseBusiness}
                  label="Infos de cie"
                  value={`${businessDoneCount}/4`}
                  tone={businessComplete ? "success" : "warning"}
                  detail="Nom, categorie, description, site"
                />
              </div>
            </div>

            <aside className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                    Niveau actuel
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-white">
                    {tierConfig.label}
                  </h2>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1",
                    tierConfig.accentClass,
                  )}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {tierConfig.eyebrow}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-white/70">
                {tierConfig.description}
              </p>

              <div className="mt-6" data-testid="verify-tier-progress">
                <div className="flex items-end justify-between gap-3">
                  <span className="text-sm font-bold text-white/70">
                    Progression
                  </span>
                  <span className="text-4xl font-black text-white">
                    {tierProgress}%
                  </span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/12">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                      tierConfig.progressClass,
                    )}
                    style={{ width: `${tierProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-2">
                {TIERS_ORDER.map((tier, index) => (
                  <div key={tier}>
                    <div
                      className={cn(
                        "h-1.5 rounded-full",
                        index <= currentTierIndex
                          ? "bg-white"
                          : "bg-white/18",
                      )}
                    />
                    <p className="mt-2 truncate text-[10px] font-bold uppercase tracking-wide text-white/58">
                      {TIER_CONFIG[tier].label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-white p-4 text-workon-ink">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-workon-muted">
                  Signaux actifs
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-3xl font-black">{completedSignals}/4</p>
                  <p className="max-w-[190px] text-right text-xs leading-5 text-workon-muted">
                    La cie reste dans le profil; ici elle sert de rappel de
                    confiance.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)]"
          id="verification-steps"
        >
          <div className="space-y-5">
            <NextActionPanel
              phoneVerified={phoneVerified}
              idVerified={idVerified}
              idPending={idPending}
              bankVerified={bankVerified}
              businessComplete={businessComplete}
              phonePending={phoneMutation.isPending}
              idPendingRequest={idMutation.isPending}
              onSendPhone={() => phoneMutation.mutate()}
              onStartId={() => idMutation.mutate()}
            />

            <section className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-workon-muted">
                    Pourquoi le faire
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-black text-workon-ink">
                    Moins de friction avant mission
                  </h2>
                </div>
                <Sparkles className="h-8 w-8 text-workon-primary" />
              </div>

              <div className="mt-5 space-y-3">
                <BenefitItem
                  icon={ShieldCheck}
                  title="Meilleure confiance"
                  text="Les clients voient un profil plus serieux avant de reserver."
                />
                <BenefitItem
                  icon={Banknote}
                  title="Paiements plus fluides"
                  text="Stripe Connect et les infos fiscales restent prets pour les recus."
                />
                <BenefitItem
                  icon={FileCheck2}
                  title="Dossier plus propre"
                  text="Chaque preuve vit au bon endroit, avec un statut facile a relire."
                />
              </div>
            </section>
          </div>

          <div className="grid gap-5">
            <StepCard
              dataTestId="verify-phone-step"
              icon={Phone}
              title="Telephone"
              description="Confirme ton numero par SMS avant les missions sensibles."
              status={
                phoneVerified
                  ? { label: "Verifie", tone: "success", icon: CheckCircle2 }
                  : { label: "A faire", tone: "neutral", icon: Phone }
              }
              meta={phoneDate ? `Confirme le ${phoneDate}` : user?.phone ?? null}
            >
              {!phoneVerified && !showOtpInput ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => phoneMutation.mutate()}
                    disabled={phoneMutation.isPending}
                    data-testid="verify-phone-send"
                  >
                    {phoneMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                    Envoyer le code
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/profile">Modifier le numero</Link>
                  </Button>
                </div>
              ) : null}

              {!phoneVerified && showOtpInput ? (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    placeholder="Code a 6 chiffres"
                    maxLength={6}
                    inputMode="numeric"
                    className="h-12 border-workon-border bg-white text-center text-lg font-bold tracking-[0.28em] text-workon-ink placeholder:text-workon-muted/50"
                    data-testid="verify-phone-code"
                    aria-label="Code de verification SMS"
                  />
                  <Button
                    type="button"
                    onClick={() => confirmOtpMutation.mutate()}
                    disabled={otpCode.length < 4 || confirmOtpMutation.isPending}
                    data-testid="verify-phone-confirm"
                  >
                    {confirmOtpMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Confirmer
                  </Button>
                </div>
              ) : null}

              {phoneVerified ? (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  Ton telephone est confirme. Ce signal est deja actif.
                </p>
              ) : null}
            </StepCard>

            <StepCard
              dataTestId="verify-identity-step"
              icon={identityStatus.icon}
              title="Piece d'identite"
              description="Lance ou reprends la verification officielle via Stripe Identity."
              status={{
                label: identityStatus.label,
                tone: identityStatus.tone,
                icon: identityStatus.icon,
              }}
              meta={
                identityDate
                  ? `Confirmee le ${identityDate}`
                  : status.identity.provider
                    ? `Provider: ${status.identity.provider}`
                    : null
              }
            >
              <p className="rounded-2xl bg-workon-bg-cream px-4 py-3 text-sm leading-6 text-workon-muted">
                {identityStatus.detail}
              </p>

              {!idVerified ? (
                <Button
                  type="button"
                  onClick={() => idMutation.mutate()}
                  disabled={idMutation.isPending}
                  data-testid="verify-identity-start"
                >
                  {idMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  {idPending ? "Reprendre la verification" : "Commencer"}
                </Button>
              ) : null}
            </StepCard>

            <StepCard
              dataTestId="verify-bank-step"
              icon={WalletCards}
              title="Paiements et banque"
              description="Relie Stripe Connect pour recevoir les paiements et completer le dossier."
              status={
                bankVerified
                  ? { label: "Verifie", tone: "success", icon: CheckCircle2 }
                  : bankConnected
                    ? { label: "Connecte", tone: "info", icon: WalletCards }
                    : { label: "A relier", tone: "neutral", icon: WalletCards }
              }
              meta={bankDate ? `Verifie le ${bankDate}` : "Stripe Connect"}
            >
              <div className="grid gap-3 rounded-2xl bg-workon-bg-cream p-4 sm:grid-cols-2">
                <SignalMini
                  label="Compte Stripe"
                  done={bankConnected}
                  doneText="Connecte"
                  pendingText="Non relie"
                />
                <SignalMini
                  label="Banque"
                  done={bankVerified}
                  doneText="Validee"
                  pendingText="A valider"
                />
              </div>
              <Button variant="outline" asChild data-testid="verify-bank-open">
                <Link href="/worker/payments">
                  Ouvrir paiements
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </StepCard>

            <StepCard
              dataTestId="verify-business-step"
              icon={BriefcaseBusiness}
              title="Infos de cie"
              description="Garde le nom legal, la categorie, la description et le site au bon endroit."
              status={
                businessComplete
                  ? { label: "Complet", tone: "success", icon: CheckCircle2 }
                  : { label: `${businessDoneCount}/4`, tone: "warning", icon: BriefcaseBusiness }
              }
              meta="Gere depuis le profil"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {businessSignals.map((signal) => (
                  <SignalMini
                    key={signal.label}
                    label={signal.label}
                    done={signal.done}
                    doneText="Present"
                    pendingText="Manquant"
                  />
                ))}
              </div>
              <div className="rounded-2xl border border-workon-border bg-white p-4 text-sm leading-6 text-workon-muted">
                Les champs fiscaux plus detailles restent dans le profil pour
                les factures. Je les garde dans la liste de rehaussement afin
                de ne pas les oublier sur la bonne page.
              </div>
              <Button variant="outline" asChild data-testid="verify-business-open">
                <Link href="/profile">
                  Ouvrir le profil
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </StepCard>
          </div>
        </section>
      </div>
    </main>
  );
}

function NextActionPanel({
  phoneVerified,
  idVerified,
  idPending,
  bankVerified,
  businessComplete,
  phonePending,
  idPendingRequest,
  onSendPhone,
  onStartId,
}: {
  phoneVerified: boolean;
  idVerified: boolean;
  idPending: boolean;
  bankVerified: boolean;
  businessComplete: boolean;
  phonePending: boolean;
  idPendingRequest: boolean;
  onSendPhone: () => void;
  onStartId: () => void;
}) {
  let content: ReactNode;

  if (!phoneVerified) {
    content = (
      <>
        <StatusPill tone="warning" icon={Phone}>
          Priorite telephone
        </StatusPill>
        <h2 className="mt-4 font-heading text-2xl font-black text-workon-ink">
          Commence par confirmer ton numero
        </h2>
        <p className="mt-2 text-sm leading-6 text-workon-muted">
          C&apos;est le premier signal de confiance et il debloque le niveau
          suivant.
        </p>
        <Button
          type="button"
          className="mt-5"
          onClick={onSendPhone}
          disabled={phonePending}
          data-testid="verify-next-phone"
        >
          {phonePending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          Envoyer le code
        </Button>
      </>
    );
  } else if (!idVerified) {
    content = (
      <>
        <StatusPill tone={idPending ? "warning" : "info"} icon={IdCard}>
          {idPending ? "Verification en cours" : "Priorite identite"}
        </StatusPill>
        <h2 className="mt-4 font-heading text-2xl font-black text-workon-ink">
          {idPending ? "Reprends la verification" : "Ajoute une preuve officielle"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-workon-muted">
          Stripe Identity garde la validation separee du profil public.
        </p>
        <Button
          type="button"
          className="mt-5"
          onClick={onStartId}
          disabled={idPendingRequest}
          data-testid="verify-next-identity"
        >
          {idPendingRequest ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {idPending ? "Reprendre" : "Commencer"}
        </Button>
      </>
    );
  } else if (!bankVerified) {
    content = (
      <>
        <StatusPill tone="info" icon={WalletCards}>
          Paiements
        </StatusPill>
        <h2 className="mt-4 font-heading text-2xl font-black text-workon-ink">
          Complete la partie paiement
        </h2>
        <p className="mt-2 text-sm leading-6 text-workon-muted">
          Relier Stripe Connect rend les paiements et recus plus solides.
        </p>
        <Button className="mt-5" asChild data-testid="verify-next-bank">
          <Link href="/worker/payments">
            Ouvrir paiements
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </>
    );
  } else if (!businessComplete) {
    content = (
      <>
        <StatusPill tone="warning" icon={BriefcaseBusiness}>
          Infos de cie
        </StatusPill>
        <h2 className="mt-4 font-heading text-2xl font-black text-workon-ink">
          Termine le profil entreprise
        </h2>
        <p className="mt-2 text-sm leading-6 text-workon-muted">
          Ces champs vivent mieux dans le profil, mais ils renforcent aussi le
          dossier de confiance.
        </p>
        <Button className="mt-5" asChild data-testid="verify-next-business">
          <Link href="/profile">
            Ouvrir le profil
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </>
    );
  } else {
    content = (
      <>
        <StatusPill tone="success" icon={ShieldCheck}>
          Dossier solide
        </StatusPill>
        <h2 className="mt-4 font-heading text-2xl font-black text-workon-ink">
          Tous les signaux principaux sont actifs
        </h2>
        <p className="mt-2 text-sm leading-6 text-workon-muted">
          Ton profil est pret pour les clients, les paiements et les recus.
        </p>
        <Button className="mt-5" asChild data-testid="verify-next-profile">
          <Link href="/profile">
            Retour au profil
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </>
    );
  }

  return (
    <section
      className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6"
      data-testid="verify-next-action"
    >
      {content}
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: StatusTone;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-workon-primary">
          <Icon className="h-5 w-5" />
        </div>
        <StatusDot tone={tone} />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-white/56">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
      <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-5 text-white/62">
        {detail}
      </p>
    </div>
  );
}

function StepCard({
  icon: Icon,
  title,
  description,
  status,
  meta,
  children,
  dataTestId,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  status: { label: string; tone: StatusTone; icon: LucideIcon };
  meta?: string | null;
  children: ReactNode;
  dataTestId: string;
}) {
  const StatusIcon = status.icon;

  return (
    <section
      className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6"
      data-testid={dataTestId}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-workon-bg-cream text-workon-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-black text-workon-ink">
              {title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-workon-muted">
              {description}
            </p>
            {meta ? (
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-workon-muted">
                {meta}
              </p>
            ) : null}
          </div>
        </div>

        <StatusPill tone={status.tone} icon={StatusIcon}>
          {status.label}
        </StatusPill>
      </div>

      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function StatusPill({
  tone,
  icon: Icon,
  children,
}: {
  tone: StatusTone;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1",
        STATUS_TONE_CLASSES[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function StatusDot({ tone }: { tone: StatusTone }) {
  const dotClass: Record<StatusTone, string> = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-red-400",
    info: "bg-blue-400",
    neutral: "bg-white/40",
  };

  return (
    <span
      className={cn("h-3 w-3 rounded-full ring-4 ring-white/12", dotClass[tone])}
      aria-hidden="true"
    />
  );
}

function SignalMini({
  label,
  done,
  doneText,
  pendingText,
}: {
  label: string;
  done: boolean;
  doneText: string;
  pendingText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-workon-border bg-white px-4 py-3">
      <div>
        <p className="text-sm font-bold text-workon-ink">{label}</p>
        <p className="text-xs text-workon-muted">
          {done ? doneText : pendingText}
        </p>
      </div>
      {done ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      ) : (
        <Clock3 className="h-5 w-5 text-amber-600" />
      )}
    </div>
  );
}

function BenefitItem({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-workon-bg-cream p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-workon-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-bold text-workon-ink">{title}</p>
        <p className="mt-1 text-sm leading-6 text-workon-muted">{text}</p>
      </div>
    </div>
  );
}
