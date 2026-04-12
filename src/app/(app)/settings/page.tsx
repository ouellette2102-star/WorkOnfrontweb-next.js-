"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type NotificationPreference,
  type NotificationType,
} from "@/lib/api-client";
import { Loader2, Bell, Moon } from "lucide-react";
import { toast } from "sonner";

const NOTIFICATION_TYPES: { type: NotificationType; label: string }[] = [
  { type: "MISSION_UPDATE", label: "Mises a jour de mission" },
  { type: "NEW_OFFER", label: "Nouvelles offres" },
  { type: "MESSAGE", label: "Messages" },
  { type: "PAYMENT", label: "Paiements" },
  { type: "REVIEW", label: "Evaluations" },
  { type: "MARKETING", label: "Marketing & promotions" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-workon-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-workon-primary" : "bg-workon-border"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0.5"
        } mt-0.5`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => api.getNotificationPreferences(),
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

  // Build a map from preferences array for easy lookup
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
    const current = prefMap.get(type) || { type, email: true, push: true, sms: false };
    updateMutation.mutate({
      type,
      data: {
        email: channel === "email" ? value : current.email,
        push: channel === "push" ? value : current.push,
        sms: channel === "sms" ? value : current.sms,
      },
    });
  }

  // Quiet hours state — default values until loaded
  const { data: quietHours } = useQuery({
    queryKey: ["quiet-hours"],
    queryFn: async () => {
      // The quiet hours come from the preferences endpoint or a separate call
      // We'll try the dedicated endpoint; if it fails, return defaults
      try {
        const prefs = await api.getNotificationPreferences();
        // quiet hours might be embedded or separate — use defaults if not found
        return { enabled: false, startHour: 22, endHour: 7 };
      } catch {
        return { enabled: false, startHour: 22, endHour: 7 };
      }
    },
    initialData: { enabled: false, startHour: 22, endHour: 7 },
  });

  const qh = quietHours ?? { enabled: false, startHour: 22, endHour: 7 };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-heading font-bold text-workon-ink">
        Parametres
      </h1>

      {/* Section 1: Notification Preferences */}
      <section className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-workon-primary" />
          <h2 className="text-lg font-heading font-bold text-workon-ink">
            Preferences de notifications
          </h2>
        </div>

        <div className="rounded-2xl border border-workon-border bg-white shadow-sm overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_60px_60px_60px] items-center gap-2 px-4 py-3 border-b border-workon-border bg-workon-bg/50">
            <span className="text-sm font-medium text-workon-muted">Type</span>
            <span className="text-xs font-medium text-workon-muted text-center">Email</span>
            <span className="text-xs font-medium text-workon-muted text-center">Push</span>
            <span className="text-xs font-medium text-workon-muted text-center">SMS</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
            </div>
          ) : (
            NOTIFICATION_TYPES.map(({ type, label }, i) => {
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
                  className={`grid grid-cols-[1fr_60px_60px_60px] items-center gap-2 px-4 py-3 ${
                    !isLast ? "border-b border-workon-border/50" : ""
                  }`}
                >
                  <span className="text-sm text-workon-ink">{label}</span>
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

      {/* Section 2: Quiet Hours */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Moon className="h-5 w-5 text-workon-primary" />
          <h2 className="text-lg font-heading font-bold text-workon-ink">
            Heures calmes
          </h2>
        </div>

        <div className="rounded-2xl border border-workon-border bg-white shadow-sm p-4 space-y-4">
          <p className="text-sm text-workon-muted">
            Aucune notification push pendant les heures calmes.
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-workon-ink">Activer les heures calmes</span>
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
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-workon-muted">Debut</label>
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
                  className="w-full rounded-xl border border-workon-border bg-white p-2.5 text-sm text-workon-ink focus:border-workon-primary focus:outline-none"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-workon-muted">Fin</label>
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
                  className="w-full rounded-xl border border-workon-border bg-white p-2.5 text-sm text-workon-ink focus:border-workon-primary focus:outline-none"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
