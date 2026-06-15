"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Briefcase,
  ChevronRight,
  Clock3,
  CreditCard,
  FileCheck,
  Loader2,
  Lock,
  Moon,
  Scale,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  User,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useMode } from "@/contexts/mode-context";
import {
  api,
  type ContractResponse,
  type DisputeResponse,
  type MissionResponse,
  type NotificationPreference,
  type NotificationType,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

const NOTIFICATION_TYPES: { type: NotificationType; label: string; detail: string }[] = [
  {
    type: "MISSION_UPDATE",
    label: "Missions",
    detail: "Statuts, offres, acceptations et progression.",
  },
  {
    type: "NEW_OFFER",
    label: "Offres",
    detail: "Nouvelles propositions ou reponses importantes.",
  },
  {
    type: "MESSAGE",
    label: "Messages",
    detail: "Conversations qui gardent la preuve dans WorkOn.",
  },
  {
    type: "PAYMENT",
    label: "Paiements",
    detail: "Factures, recus, revenus et versements.",
  },
  {
    type: "REVIEW",
    label: "Evaluations",
    detail: "Avis et reputation apres mission.",
  },
  {
    type: "MARKETING",
    label: "Opportunites",
    detail: "Nouveautes, leads et annonces non critiques.",
  },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type Tone = "green" | "copper" | "blue" | "gold" | "red" | "stone";

const toneClasses: Record<Tone, { chip: string; icon: string; card: string }> = {
  green: {
    chip: "border-workon-success/20 bg-workon-success-subtle text-workon-success",
    icon: "bg-workon-success-subtle text-workon-success",
    card: "border-workon-success/20 bg-workon-success-subtle",
  },
  copper: {
    chip: "border-workon-copper/25 bg-workon-copper/10 text-workon-copper",
    icon: "bg-workon-copper/10 text-workon-copper",
    card: "border-workon-copper/25 bg-workon-copper/10",
  },
  blue: {
    chip: "border-workon-info/20 bg-workon-info-subtle text-workon-info",
    icon: "bg-workon-info-subtle text-workon-info",
    card: "border-workon-info/20 bg-workon-info-subtle",
  },
  gold: {
    chip: "border-workon-warning/20 bg-workon-warning-subtle text-workon-warning",
    icon: "bg-workon-warning-subtle text-workon-warning",
    card: "border-workon-warning/20 bg-workon-warning-subtle",
  },
  red: {
    chip: "border-workon-error/20 bg-workon-error-subtle text-workon-error",
    icon: "bg-workon-error-subtle text-workon-error",
    card: "border-workon-error/20 bg-workon-error-subtle",
  },
  stone: {
    chip: "border-workon-border bg-white text-workon-stone",
    icon: "bg-workon-bg text-workon-stone",
    card: "border-workon-border bg-white",
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

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-11 w-16 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-workon-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-workon-primary" : "bg-workon-border",
      )}
    >
      <span
        className={cn(
          "pointer-events-none mt-1 inline-block h-9 w-9 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function HubMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  const classes = toneClasses[tone];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-white min-[420px]:p-3">
      <div className="flex items-start justify-between gap-2 min-[420px]:gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55 min-[420px]:text-[10px]">
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

function AccountRoute({
  href,
  icon: Icon,
  title,
  value,
  detail,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
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
          <span className="flex items-start justify-between gap-2">
            <span>
              <span className="block text-sm font-black text-workon-ink">{title}</span>
              <span className={cn("mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold", classes.chip)}>
                {value}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-workon-stone transition group-hover:translate-x-0.5 group-hover:text-workon-primary" />
          </span>
          <span className="mt-2 block text-xs leading-relaxed text-workon-gray">
            {detail}
          </span>
        </span>
      </div>
    </Link>
  );
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  text,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-workon-primary/10 text-workon-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-workon-stone">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-heading text-2xl font-black tracking-tight text-workon-ink">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-workon-gray">
          {text}
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { mode } = useMode();
  const isWorker = user?.role === "worker";

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => api.getNotificationPreferences(),
  });

  const { data: verification } = useQuery({
    queryKey: ["verification-status", "settings-hub"],
    queryFn: () => api.getVerificationStatus(),
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });

  const { data: completion } = useQuery({
    queryKey: ["profile-completion", "settings-hub"],
    queryFn: () => api.getMyCompletion(),
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription-me", "settings-hub"],
    queryFn: () => api.getSubscription(),
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });

  const { data: quota } = useQuery({
    queryKey: ["missions-quota", "settings-hub"],
    queryFn: () => api.getMissionsQuota(),
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });

  const { data: earnings } = useQuery({
    queryKey: ["earnings-summary", "settings-hub"],
    queryFn: () => api.getEarningsSummary(),
    enabled: !!user && isWorker,
    retry: false,
    staleTime: 60_000,
  });

  const { data: contracts } = useQuery({
    queryKey: ["my-contracts", "settings-hub"],
    queryFn: () => api.getMyContracts(),
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });

  const { data: disputes } = useQuery({
    queryKey: ["my-disputes", "settings-hub"],
    queryFn: () => api.getMyDisputes(),
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });

  const { data: missions } = useQuery({
    queryKey: ["settings-hub-missions", user?.role],
    queryFn: () => (isWorker ? api.getMyAssignments() : api.getMyMissions()),
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      type,
      data,
    }: {
      type: NotificationType;
      data: { email: boolean; push: boolean; sms: boolean };
    }) => api.updateNotificationPreference(type, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Preference mise a jour");
    },
    onError: () => toast.error("Erreur lors de la mise a jour"),
  });

  const quietHoursMutation = useMutation({
    mutationFn: (data: { enabled: boolean; startHour: number; endHour: number }) =>
      api.setQuietHours(data),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["quiet-hours"], variables);
      toast.success("Heures calmes mises a jour");
    },
    onError: () => toast.error("Erreur lors de la mise a jour"),
  });

  const prefMap = new Map<NotificationType, NotificationPreference>();
  if (preferences) {
    for (const p of preferences) {
      prefMap.set(p.type, p);
    }
  }

  function handleToggle(
    type: NotificationType,
    channel: "email" | "push" | "sms",
    value: boolean,
  ) {
    const current = prefMap.get(type) || {
      type,
      email: true,
      push: true,
      sms: false,
    };
    updateMutation.mutate({
      type,
      data: {
        email: channel === "email" ? value : current.email,
        push: channel === "push" ? value : current.push,
        sms: channel === "sms" ? value : current.sms,
      },
    });
  }

  const { data: quietHours } = useQuery({
    queryKey: ["quiet-hours"],
    queryFn: async () => {
      try {
        await api.getNotificationPreferences();
        return { enabled: false, startHour: 22, endHour: 7 };
      } catch {
        return { enabled: false, startHour: 22, endHour: 7 };
      }
    },
    initialData: { enabled: false, startHour: 22, endHour: 7 },
  });

  const qh = quietHours ?? { enabled: false, startHour: 22, endHour: 7 };
  const score = completion?.score ?? 0;
  const trustTier = verification?.trustTier ?? "BASIC";
  const activeContractCount = activeContracts(contracts);
  const disputeCount = activeDisputes(disputes);
  const missionCount = activeMissions(missions);
  const plan = subscription?.plan ?? "FREE";
  const pendingMoney = earnings?.totalPending ?? 0;
  const quotaLabel = quota
    ? `${quota.used}/${quota.limit === null ? "illimite" : quota.limit}`
    : "A verifier";

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-36">
      <section className="workon-dark-panel overflow-hidden rounded-[30px] p-4 shadow-lg shadow-workon-primary/15 min-[420px]:p-5 md:p-7">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:gap-6">
          <div>
            <div className="flex items-start gap-3 min-[420px]:gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/15 bg-white/10 text-lg font-black text-white shadow-xl min-[420px]:h-16 min-[420px]:w-16 min-[420px]:rounded-[22px] min-[420px]:text-xl">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 min-[420px]:px-3 min-[420px]:text-[11px] min-[420px]:tracking-[0.18em]">
                  <Settings className="h-3.5 w-3.5 text-workon-gold" />
                  Centre compte
                </div>
                <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-white min-[420px]:mt-3 min-[420px]:text-4xl md:text-5xl">
                  Parametres
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70 min-[420px]:mt-3">
                  Configure les signaux qui soutiennent la confiance: profil,
                  verification, paiements, contrats, donnees et notifications.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 min-[420px]:mt-5 min-[420px]:gap-3 md:grid-cols-4">
              <HubMetric
                icon={ShieldCheck}
                label="Confiance"
                value={trustTier}
                detail={`${Math.round(score)}% du profil complete.`}
                tone={trustTier === "BASIC" ? "gold" : "green"}
              />
              <HubMetric
                icon={CreditCard}
                label={isWorker ? "A recevoir" : "Plan"}
                value={isWorker ? formatMoney(pendingMoney) : plan}
                detail={isWorker ? "Revenus en attente." : "Abonnement et quota."}
                tone={isWorker && pendingMoney > 0 ? "copper" : "green"}
              />
              <HubMetric
                icon={FileCheck}
                label="Contrats"
                value={String(activeContractCount)}
                detail="Dossiers actifs a suivre."
                tone={activeContractCount > 0 ? "blue" : "stone"}
              />
              <HubMetric
                icon={Scale}
                label="Litiges"
                value={String(disputeCount)}
                detail="Risques ouverts."
                tone={disputeCount > 0 ? "red" : "green"}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55 min-[420px]:text-[11px]">
              Priorite actuelle
            </p>
            <h2 className="mt-1.5 font-heading text-xl font-black text-white min-[420px]:mt-2 min-[420px]:text-2xl">
              {isWorker
                ? pendingMoney > 0
                  ? "Recevoir les revenus en attente"
                  : "Rendre le profil plus reservable"
                : "Publier et suivre les demandes"}
            </h2>
            <p className="mt-2 hidden text-sm leading-relaxed text-white/68 min-[420px]:line-clamp-2 min-[420px]:block">
              WorkOn doit garder les actions critiques dans le systeme:
              messages, contrats, paiements, preuves et support.
            </p>
            <div className="mt-3 grid gap-2 min-[420px]:mt-4">
              <Link
                href={isWorker && pendingMoney > 0 ? "/worker/payments" : "/profile"}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-workon-primary shadow-sm transition hover:-translate-y-0.5 min-[420px]:py-3"
              >
                <span className="inline-flex items-center gap-2">
                  {isWorker && pendingMoney > 0 ? (
                    <WalletCards className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  {isWorker && pendingMoney > 0
                    ? "Configurer mes paiements"
                    : "Ameliorer mon profil"}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/settings/privacy"
                  className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-sm font-bold text-white transition hover:bg-white/15 min-[420px]:p-3"
                >
                  <Lock className="mb-1.5 h-4 w-4 text-workon-gold min-[420px]:mb-2" />
                  Donnees
                </Link>
                <Link
                  href="/settings/subscription"
                  className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-sm font-bold text-white transition hover:bg-white/15 min-[420px]:p-3"
                >
                  <CreditCard className="mb-1.5 h-4 w-4 text-workon-gold min-[420px]:mb-2" />
                  Quota {quotaLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-7 space-y-4">
        <SectionHeading
          icon={SlidersHorizontal}
          eyebrow="Raccourcis"
          title="Operations du compte"
          text="Chaque tuile donne acces a un flux existant. Rien n'est masque: argent, contrat, litige, profil, confidentialite et notifications restent visibles."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AccountRoute
            href="/profile"
            icon={User}
            title="Profil public"
            value={`${Math.round(score)}% complet`}
            detail="Photo, ville, metier, bio, portfolio et informations legales."
            tone={score >= 80 ? "green" : "gold"}
          />
          <AccountRoute
            href={isWorker ? "/earnings" : "/invoices"}
            icon={isWorker ? WalletCards : CreditCard}
            title={isWorker ? "Revenus" : "Factures"}
            value={isWorker ? formatMoney(pendingMoney) : "Historique"}
            detail={isWorker ? "Gains, versements et argent en attente." : "Recus, paiements et documents de mission."}
            tone={isWorker && pendingMoney > 0 ? "copper" : "green"}
          />
          <AccountRoute
            href="/settings/subscription"
            icon={Briefcase}
            title="Abonnement et quota"
            value={quotaLabel}
            detail="Missions publiees, plan actif et portail de facturation."
            tone={plan === "FREE" ? "stone" : "green"}
          />
          <AccountRoute
            href="/contracts"
            icon={FileCheck}
            title="Contrats"
            value={`${activeContractCount} actif${activeContractCount > 1 ? "s" : ""}`}
            detail="Conditions, acceptations, mission liee et historique."
            tone={activeContractCount > 0 ? "blue" : "stone"}
          />
          <AccountRoute
            href="/disputes"
            icon={Scale}
            title="Litiges"
            value={disputeCount > 0 ? `${disputeCount} ouvert${disputeCount > 1 ? "s" : ""}` : "Clair"}
            detail="Preuves, mediation et suivi si une mission bloque."
            tone={disputeCount > 0 ? "red" : "green"}
          />
          <AccountRoute
            href={mode === "pro" ? "/missions/mine" : "/missions/mine"}
            icon={Briefcase}
            title={mode === "pro" ? "Affectations" : "Publications"}
            value={`${missionCount} actif${missionCount > 1 ? "s" : ""}`}
            detail="Missions ouvertes, assignees ou en cours."
            tone={missionCount > 0 ? "blue" : "stone"}
          />
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <SectionHeading
          icon={Bell}
          eyebrow="Signaux"
          title="Preferences de notifications"
          text="Choisis les canaux selon le risque: missions, messages et paiements doivent rester faciles a suivre."
        />

        <div className="overflow-hidden rounded-[28px] border border-workon-border bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_64px_64px_64px] items-center gap-2 border-b border-workon-border bg-workon-bg/60 px-4 py-3">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-workon-stone">
              Type
            </span>
            <span className="text-center text-xs font-black text-workon-stone">
              Email
            </span>
            <span className="text-center text-xs font-black text-workon-stone">
              Push
            </span>
            <span className="text-center text-xs font-black text-workon-stone">
              SMS
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12" role="status">
              <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
              <span className="sr-only">Chargement des preferences.</span>
            </div>
          ) : (
            NOTIFICATION_TYPES.map(({ type, label, detail }, i) => {
              const pref = prefMap.get(type) || {
                type,
                email: true,
                push: true,
                sms: false,
              };
              const isLast = i === NOTIFICATION_TYPES.length - 1;
              return (
                <div
                  key={type}
                  className={cn(
                    "grid grid-cols-[1fr_64px_64px_64px] items-center gap-2 px-4 py-4",
                    !isLast && "border-b border-workon-border/60",
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black text-workon-ink">{label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-workon-gray">
                      {detail}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Toggle
                      checked={pref.email}
                      onChange={(v) => handleToggle(type, "email", v)}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Toggle
                      checked={pref.push}
                      onChange={(v) => handleToggle(type, "push", v)}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Toggle
                      checked={pref.sms}
                      onChange={(v) => handleToggle(type, "sms", v)}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm">
          <SectionHeading
            icon={Moon}
            eyebrow="Rythme"
            title="Heures calmes"
            text="Les alertes critiques restent visibles dans l'app; les pushes peuvent attendre quand tu choisis une plage calme."
          />

          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-workon-border bg-workon-bg/60 p-4">
            <div>
              <p className="text-sm font-black text-workon-ink">
                Activer les heures calmes
              </p>
              <p className="mt-1 text-xs text-workon-gray">
                Aucune notification push pendant cette plage.
              </p>
            </div>
            <Toggle
              checked={qh.enabled}
              onChange={(v) =>
                quietHoursMutation.mutate({
                  enabled: v,
                  startHour: qh.startHour,
                  endHour: qh.endHour,
                })
              }
              disabled={quietHoursMutation.isPending}
            />
          </div>

          {qh.enabled && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-workon-stone">
                  Debut
                </span>
                <select
                  value={qh.startHour}
                  onChange={(e) =>
                    quietHoursMutation.mutate({
                      enabled: qh.enabled,
                      startHour: Number(e.target.value),
                      endHour: qh.endHour,
                    })
                  }
                  disabled={quietHoursMutation.isPending}
                  className="mt-2 w-full rounded-2xl border border-workon-border bg-white p-3 text-sm text-workon-ink focus:border-workon-primary focus:outline-none"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-workon-stone">
                  Fin
                </span>
                <select
                  value={qh.endHour}
                  onChange={(e) =>
                    quietHoursMutation.mutate({
                      enabled: qh.enabled,
                      startHour: qh.startHour,
                      endHour: Number(e.target.value),
                    })
                  }
                  disabled={quietHoursMutation.isPending}
                  className="mt-2 w-full rounded-2xl border border-workon-border bg-white p-3 text-sm text-workon-ink focus:border-workon-primary focus:outline-none"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm">
          <SectionHeading
            icon={ShieldCheck}
            eyebrow="Loi 25"
            title="Confidentialite et donnees"
            text="Exporter les donnees, consulter les consentements et gerer la suppression de compte avec confirmation."
          />
          <div className="mt-5 grid gap-3">
            <Link
              href="/settings/privacy"
              data-testid="settings-privacy-link"
              className="flex items-center gap-3 rounded-2xl border border-workon-border bg-workon-bg/60 p-4 transition hover:bg-workon-bg"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-workon-primary/10 text-workon-primary">
                <Lock className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-workon-ink">
                  Confidentialite et donnees
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-workon-gray">
                  Export, consentements, suppression et droits applicables.
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-workon-stone" />
            </Link>
            <div className="rounded-2xl border border-workon-border bg-workon-bg/50 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-workon-ink">
                <Clock3 className="h-4 w-4 text-workon-copper" />
                Preuves conservees
              </div>
              <p className="mt-2 text-xs leading-relaxed text-workon-gray">
                Messages, contrats, factures, avis et litiges doivent rester
                dans WorkOn pour soutenir les decisions et le support.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
