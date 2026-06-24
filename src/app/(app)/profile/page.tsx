"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Briefcase,
  Calendar,
  Camera,
  ClipboardList,
  CreditCard,
  FileCheck,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Scale,
  Settings,
  ShieldCheck,
  Star,
  User,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { BusinessInfoEditor } from "@/components/profile/business-info-editor";
import { IdentityVerifyGate } from "@/components/profile/identity-verify-gate";
import { PortfolioUploader } from "@/components/profile/portfolio-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { WorkerCardEditor } from "@/components/profile/worker-card-editor";
import { StripeConnectGate } from "@/components/worker/stripe-connect-gate";
import { useAuth } from "@/contexts/auth-context";
import { useMode } from "@/contexts/mode-context";
import {
  api,
  type ContractResponse,
  type DisputeResponse,
  type MissionResponse,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Tone = "green" | "copper" | "gold" | "blue" | "red" | "stone";

const toneClasses: Record<Tone, { chip: string; icon: string; panel: string }> = {
  green: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "bg-emerald-50 text-emerald-700",
    panel: "border-emerald-200 bg-emerald-50",
  },
  copper: {
    chip: "border-workon-copper/25 bg-workon-copper/10 text-workon-copper",
    icon: "bg-workon-copper/10 text-workon-copper",
    panel: "border-workon-copper/25 bg-workon-copper/10",
  },
  gold: {
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    icon: "bg-amber-50 text-amber-700",
    panel: "border-amber-200 bg-amber-50",
  },
  blue: {
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    icon: "bg-blue-50 text-blue-700",
    panel: "border-blue-200 bg-blue-50",
  },
  red: {
    chip: "border-red-200 bg-red-50 text-red-700",
    icon: "bg-red-50 text-red-700",
    panel: "border-red-200 bg-red-50",
  },
  stone: {
    chip: "border-workon-border bg-white text-workon-stone",
    icon: "bg-workon-bg text-workon-stone",
    panel: "border-workon-border bg-white",
  },
};

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function getInitials(firstName?: string, lastName?: string) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`
    .trim()
    .toUpperCase();
  return initials || "WO";
}

function getRoleLabel(role?: string) {
  if (role === "worker") return "Travailleur";
  if (role === "employer") return "Entreprise";
  if (role === "residential_client") return "Client";
  if (role === "admin") return "Admin";
  return "Compte WorkOn";
}

function activeContracts(contracts?: ContractResponse[]) {
  return (contracts ?? []).filter((contract) =>
    ["PENDING", "ACCEPTED"].includes(contract.status),
  ).length;
}

function activeDisputes(disputes?: DisputeResponse[]) {
  return (disputes ?? []).filter((dispute) =>
    ["OPEN", "IN_MEDIATION"].includes(dispute.status),
  ).length;
}

function activeMissions(missions?: MissionResponse[]) {
  return (missions ?? []).filter((mission) =>
    ["open", "assigned", "in_progress"].includes(mission.status),
  ).length;
}

function AccountMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "stone",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  const classes = toneClasses[tone];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-white shadow-sm min-[420px]:p-3">
      <div className="flex items-start justify-between gap-2 min-[420px]:gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/55 min-[420px]:text-[10px]">
            {label}
          </p>
          <p className="mt-1 text-xl font-black tracking-tight min-[420px]:text-2xl">
            {value}
          </p>
          <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-white/65 min-[420px]:line-clamp-2 min-[420px]:text-xs">
            {detail}
          </p>
        </div>
        <span className={cn("rounded-xl p-1.5 min-[420px]:p-2", classes.icon)}>
          <Icon className="h-3.5 w-3.5 min-[420px]:h-4 min-[420px]:w-4" />
        </span>
      </div>
    </div>
  );
}

function TrustSignal({
  icon: Icon,
  label,
  value,
  tone,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: Tone;
  href?: string;
}) {
  const classes = toneClasses[tone];
  const content = (
    <>
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", classes.icon)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold uppercase tracking-[0.14em] text-workon-muted">
          {label}
        </span>
        <span className="mt-1 block text-sm font-black text-workon-ink">
          {value}
        </span>
      </span>
      {href ? <ArrowRight className="h-4 w-4 text-workon-stone" /> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-sm",
          classes.panel,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border p-3", classes.panel)}>
      {content}
    </div>
  );
}

function OperationTile({
  href,
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}) {
  const classes = toneClasses[tone];
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-workon-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-workon-primary/25 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", classes.icon)}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-black text-workon-ink">{label}</span>
            <ArrowRight className="h-4 w-4 text-workon-stone transition group-hover:translate-x-0.5 group-hover:text-workon-primary" />
          </span>
          <span className="mt-2 block text-xl font-black tracking-tight text-workon-ink">
            {value}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-workon-muted">
            {detail}
          </span>
        </span>
      </div>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-workon-stone">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-2xl font-black tracking-tight text-workon-ink">
        {title}
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-workon-muted">
        {text}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { mode } = useMode();

  // Acting-as: the Pro/Client mode selects the view, not the locked role.
  const isWorker = mode === "pro";
  const isClient = mode === "client";

  const { data: verification } = useQuery({
    queryKey: ["verification-status", "profile-hub"],
    queryFn: () => api.getVerificationStatus(),
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });

  const { data: completion } = useQuery({
    queryKey: ["profile-completion", "profile-hub"],
    queryFn: () => api.getMyCompletion(),
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });

  const { data: notificationCount } = useQuery({
    queryKey: ["notification-unread-count", "profile-hub"],
    queryFn: () => api.getNotificationUnreadCount(),
    enabled: !!user,
    retry: false,
    staleTime: 30_000,
  });

  const { data: contracts } = useQuery({
    queryKey: ["my-contracts", "profile-hub"],
    queryFn: () => api.getMyContracts(),
    enabled: !!user,
    retry: false,
    staleTime: 45_000,
  });

  const { data: disputes } = useQuery({
    queryKey: ["my-disputes", "profile-hub"],
    queryFn: () => api.getMyDisputes(),
    enabled: !!user,
    retry: false,
    staleTime: 45_000,
  });

  const { data: earnings } = useQuery({
    queryKey: ["earnings-summary", "profile-hub"],
    queryFn: () => api.getEarningsSummary(),
    enabled: !!user && isWorker,
    retry: false,
    staleTime: 45_000,
  });

  const { data: missions } = useQuery({
    queryKey: ["profile-hub-missions", user?.role],
    queryFn: () => (isWorker ? api.getMyAssignments() : api.getMyMissions()),
    enabled: !!user,
    retry: false,
    staleTime: 45_000,
  });

  const profileScore = completion?.score ?? 0;
  const unread = notificationCount?.count ?? 0;
  const pendingMoney = earnings?.totalPending ?? 0;
  const contractCount = activeContracts(contracts);
  const disputeCount = activeDisputes(disputes);
  const missionCount = activeMissions(missions);

  const primaryAction = useMemo(() => {
    if (isWorker && pendingMoney > 0) {
      return {
        href: "/worker/payments",
        label: "Recevoir mes paiements",
        icon: WalletCards,
      };
    }
    if (mode === "pro") {
      return {
        href: "/worker/missions",
        label: "Trouver une mission",
        icon: Briefcase,
      };
    }
    return {
      href: "/missions/new",
      label: "Publier une mission",
      icon: ClipboardList,
    };
  }, [isWorker, mode, pendingMoney]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  const PrimaryIcon = primaryAction.icon;
  const trustTier = verification?.trustTier ?? "BASIC";
  const phoneVerified = verification?.phone.verified ?? false;
  const identityVerified = verification?.identity.status === "VERIFIED";
  const bankVerified = verification?.bank.verified ?? false;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-5 pb-36">
      <section className="workon-dark-panel overflow-hidden rounded-[30px] p-4 shadow-lg shadow-workon-primary/15 min-[420px]:p-5 md:p-7">
        <div className="relative z-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
          <div className="space-y-4 min-[420px]:space-y-5">
            <div className="flex items-start gap-3 min-[420px]:gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[22px] border border-white/15 bg-white/10 shadow-xl min-[420px]:h-20 min-[420px]:w-20 min-[420px]:rounded-[26px]">
                {user.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.pictureUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-black text-white min-[420px]:text-2xl">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 rounded-full border border-white/20 bg-workon-copper p-1 text-white">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5 min-[420px]:gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/75 min-[420px]:px-3 min-[420px]:text-[11px]">
                    <User className="h-3.5 w-3.5 text-workon-gold" />
                    {getRoleLabel(user.role)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100 min-[420px]:px-3 min-[420px]:text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {trustTier}
                  </span>
                </div>
                <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-white min-[420px]:mt-3 min-[420px]:text-4xl md:text-5xl">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white/70 min-[420px]:mt-3">
                  {user.city ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-workon-gold" />
                      {user.city}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-emerald-200" />
                    Compte protégé
                  </span>
                  <span
                    className="max-w-[210px] truncate text-xs min-[420px]:max-w-xs min-[420px]:text-sm"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 min-[420px]:gap-3 md:grid-cols-4">
              <AccountMetric
                icon={ShieldCheck}
                label="Profil"
                value={`${Math.round(profileScore)}%`}
                detail="Signal de confiance et complétude."
                tone={profileScore >= 80 ? "green" : "gold"}
              />
              <AccountMetric
                icon={WalletCards}
                label={isWorker ? "À recevoir" : "Paiement"}
                value={isWorker ? formatMoney(pendingMoney) : "Protégé"}
                detail={isWorker ? "Fonds en attente de versement." : "Paiements et factures suivis."}
                tone={isWorker && pendingMoney > 0 ? "copper" : "green"}
              />
              <AccountMetric
                icon={FileCheck}
                label="Contrats"
                value={String(contractCount)}
                detail="Dossiers actifs à surveiller."
                tone={contractCount > 0 ? "blue" : "stone"}
              />
              <AccountMetric
                icon={Bell}
                label="Signaux"
                value={String(unread)}
                detail="Messages, missions et alertes."
                tone={unread > 0 ? "copper" : "stone"}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55 min-[420px]:text-[11px]">
              Quoi faire maintenant
            </p>
            <h2 className="mt-1.5 font-heading text-xl font-black text-white min-[420px]:mt-2 min-[420px]:text-2xl">
              Tableau de contrôle
            </h2>
            <p className="mt-2 hidden text-sm leading-relaxed text-white/68 min-[420px]:line-clamp-2 min-[420px]:block">
              Les éléments critiques du compte sont regroupés ici pour protéger
              les missions, l&apos;argent, les contrats et la réputation.
            </p>

            <div className="mt-3 grid gap-2 min-[420px]:mt-4">
              <Link
                href={primaryAction.href}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-workon-primary shadow-sm transition hover:-translate-y-0.5 min-[420px]:py-3"
              >
                <span className="inline-flex items-center gap-2">
                  <PrimaryIcon className="h-4 w-4" />
                  {primaryAction.label}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/messages"
                  className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-sm font-bold text-white transition hover:bg-white/15 min-[420px]:p-3"
                >
                  <MessageCircle className="mb-1.5 h-4 w-4 text-workon-gold min-[420px]:mb-2" />
                  Messages
                </Link>
                <Link
                  href="/support"
                  className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-sm font-bold text-white transition hover:bg-white/15 min-[420px]:p-3"
                >
                  <AlertTriangle className="mb-1.5 h-4 w-4 text-workon-gold min-[420px]:mb-2" />
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <TrustSignal
          icon={ShieldCheck}
          label="Identité"
          value={identityVerified ? "Vérifiée" : phoneVerified ? "Téléphone vérifié" : "À vérifier"}
          tone={identityVerified || phoneVerified ? "green" : "gold"}
          href="/profile/verify"
        />
        <TrustSignal
          icon={CreditCard}
          label="Paiements"
          value={bankVerified ? "Compte prêt" : isWorker ? "À configurer au bon moment" : "Factures suivies"}
          tone={bankVerified ? "green" : "stone"}
          href={isWorker ? "/worker/payments" : "/invoices"}
        />
        <TrustSignal
          icon={FileCheck}
          label="Contrat protégé"
          value={`${contractCount} actif${contractCount > 1 ? "s" : ""}`}
          tone={contractCount > 0 ? "blue" : "stone"}
          href="/contracts"
        />
        <TrustSignal
          icon={Scale}
          label="Litiges"
          value={disputeCount > 0 ? `${disputeCount} à traiter` : "Aucun signal critique"}
          tone={disputeCount > 0 ? "red" : "green"}
          href="/disputes"
        />
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Opérations"
          title="Centre de compte"
          text="Chaque tuile mène à une partie active de l'entreprise WorkOn: argent, contrats, missions, réputation et support."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <OperationTile
            href={isWorker ? "/earnings" : "/invoices"}
            icon={WalletCards}
            label={isWorker ? "Revenus" : "Factures"}
            value={isWorker ? formatMoney(pendingMoney) : "Dossier client"}
            detail={isWorker ? "Gains, paiements reçus et sommes en attente." : "Paiements, taxes et reçus de mission."}
            tone={isWorker && pendingMoney > 0 ? "copper" : "green"}
          />
          <OperationTile
            href="/missions/mine"
            icon={ClipboardList}
            label={mode === "pro" ? "Affectations" : "Publications"}
            value={`${missionCount} actif${missionCount > 1 ? "s" : ""}`}
            detail="Missions ouvertes, assignées ou en cours."
            tone={missionCount > 0 ? "blue" : "stone"}
          />
          <OperationTile
            href="/contracts"
            icon={FileCheck}
            label="Contrats"
            value={`${contractCount} en suivi`}
            detail="Conditions, acceptations et dossiers de preuve."
            tone={contractCount > 0 ? "blue" : "stone"}
          />
          <OperationTile
            href="/disputes"
            icon={Scale}
            label="Litiges"
            value={disputeCount > 0 ? `${disputeCount} ouvert${disputeCount > 1 ? "s" : ""}` : "Clair"}
            detail="Protection, arbitrage et preuves si un problème survient."
            tone={disputeCount > 0 ? "red" : "green"}
          />
          <OperationTile
            href={isClient ? "/swipe" : "/calendar"}
            icon={Calendar}
            label={isClient ? "Réservation" : "Disponibilités"}
            value={isClient ? "Planifier" : "Calendrier"}
            detail={isClient ? "Trouver et réserver un pro avec contrat." : "Horaires, disponibilités et blocages."}
            tone="gold"
          />
          <OperationTile
            href="/settings"
            icon={Settings}
            label="Paramètres"
            value="Préférences"
            detail="Notifications, données, confidentialité et compte."
            tone="stone"
          />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            icon: Star,
            title: "Réputation visible",
            text: "Photo, avis, missions complétées et badges rendent le profil plus vendeur.",
          },
          {
            icon: FileCheck,
            title: "Trace contractuelle",
            text: "Contrats, messages, photos et litiges restent reliés au dossier de mission.",
          },
          {
            icon: ShieldCheck,
            title: "Confiance progressive",
            text: "Identité, téléphone, paiement et historique renforcent le niveau de confiance.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm"
          >
            <item.icon className="h-5 w-5 text-workon-copper" />
            <h3 className="mt-3 text-sm font-black text-workon-ink">
              {item.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-workon-muted">
              {item.text}
            </p>
          </div>
        ))}
      </section>

      <div className="space-y-3">
        <StripeConnectGate />
        <IdentityVerifyGate />
      </div>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Configuration"
          title="Profil public et informations"
          text="Les formulaires restent disponibles ici pour modifier les détails visibles, le portfolio, les informations légales et la fiche travailleur."
        />

        <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-workon-primary/10 text-workon-primary">
              <User className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-workon-ink">Infos publiques</p>
              <p className="text-xs text-workon-muted">
                Photo, nom, ville et coordonnées visibles dans l&apos;écosystème WorkOn.
              </p>
            </div>
          </div>
          <ProfileForm />
        </div>

        <WorkerCardEditor />
        <PortfolioUploader />
        <BusinessInfoEditor />
      </section>
    </div>
  );
}
