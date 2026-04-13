"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type HomeStats } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Loader2,
  RefreshCw,
  Database,
  Users,
  Briefcase,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Check admin access
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-red-400" />
        <h1 className="text-2xl font-bold text-workon-ink mb-2">
          Acces refuse
        </h1>
        <p className="text-workon-muted">
          Cette page est reservee aux administrateurs de la plateforme.
        </p>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["home-stats"],
    queryFn: () => api.getHomeStats(),
  });

  const reconcileMutation = useMutation({
    mutationFn: () => api.adminReconcile(),
    onSuccess: (data) => {
      toast.success("Reconciliation terminee !");
      setReconcileResult(JSON.stringify(data, null, 2));
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la reconciliation"
      ),
  });

  const seedMutation = useMutation({
    mutationFn: () => api.adminSeedCatalog(),
    onSuccess: (data) => {
      toast.success("Catalogue seed termine !");
      setSeedResult(JSON.stringify(data, null, 2));
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erreur lors du seed"
      ),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-workon-primary/20 bg-workon-primary/5 px-3 py-1 text-xs text-workon-primary mb-3">
          <Shield className="h-3.5 w-3.5" />
          Administration
        </div>
        <h1 className="text-3xl font-bold text-workon-ink">
          Tableau de bord admin
        </h1>
        <p className="mt-1 text-workon-muted">
          Gestion et maintenance de la plateforme WorkOn
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsLoading ? (
          <div className="col-span-3 flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
          </div>
        ) : stats ? (
          <>
            <StatCard
              icon={<Briefcase className="h-5 w-5 text-workon-primary" />}
              label="Contrats completes"
              value={stats.completedContracts}
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-blue-500" />}
              label="Travailleurs actifs"
              value={stats.activeWorkers}
            />
            <StatCard
              icon={<Activity className="h-5 w-5 text-emerald-500" />}
              label="Appels ouverts"
              value={stats.openServiceCalls}
            />
          </>
        ) : (
          <div className="col-span-3 text-center text-workon-muted text-sm py-8">
            Statistiques indisponibles
          </div>
        )}
      </div>

      {/* Admin Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-workon-ink">
          Actions administratives
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Reconcile payments */}
          <div className="rounded-2xl border border-workon-border bg-white p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <RefreshCw className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-workon-ink text-sm">
                  Reconcilier paiements
                </h3>
                <p className="text-xs text-workon-muted">
                  Synchronise les paiements Stripe avec la base
                </p>
              </div>
            </div>
            <Button
              onClick={() => reconcileMutation.mutate()}
              disabled={reconcileMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              {reconcileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Reconcilier
            </Button>
            {reconcileResult && (
              <pre className="rounded-xl bg-workon-bg p-3 text-xs text-workon-muted overflow-auto max-h-32">
                {reconcileResult}
              </pre>
            )}
          </div>

          {/* Seed catalog */}
          <div className="rounded-2xl border border-workon-border bg-white p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-workon-ink text-sm">
                  Seed catalogue
                </h3>
                <p className="text-xs text-workon-muted">
                  Reinitialise les categories et skills
                </p>
              </div>
            </div>
            <Button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {seedMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Seed catalogue
            </Button>
            {seedResult && (
              <pre className="rounded-xl bg-workon-bg p-3 text-xs text-workon-muted overflow-auto max-h-32">
                {seedResult}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-workon-muted/60 pt-4 pb-4">
        <p>WorkOn Administration - Actions reservees aux administrateurs</p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-white p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-workon-bg">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-workon-ink">{value}</p>
      <p className="text-sm text-workon-muted">{label}</p>
    </div>
  );
}
