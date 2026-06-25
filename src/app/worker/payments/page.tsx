"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { RequireWorkerClient } from "@/components/auth/require-worker-client";
import { Button } from "@/components/ui/button";
import { getOnboardingStatus, type WorkerPayment } from "@/lib/stripe-api";
import { api } from "@/lib/api-client";
import { EmbeddedConnectOnboarding } from "@/components/worker/embedded-connect-onboarding";
import { format } from "date-fns";
import { frCA } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import { Clock, Wallet, CreditCard, Banknote, BarChart3 } from "lucide-react";

export default function WorkerPaymentsPage() {
  return (
    <RequireWorkerClient>
      <WorkerPaymentsContent />
    </RequireWorkerClient>
  );
}

function WorkerPaymentsContent() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [payments, setPayments] = useState<WorkerPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [showEmbedded, setShowEmbedded] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      if (authLoading || !isAuthenticated) return;

      try {
        const token = getAccessToken();
        if (!token) return;

        const status = await getOnboardingStatus(token);
        setIsOnboarded(status.onboarded);
      } catch (error) {
        console.error("Erreur lors du chargement du statut:", error);
        toast.error("Impossible de vérifier le statut Stripe");
      } finally {
        setIsLoadingStatus(false);
      }
    };

    loadStatus();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const loadPayments = async () => {
      if (authLoading || !isAuthenticated || !isOnboarded) {
        setIsLoadingPayments(false);
        return;
      }

      try {
        const token = getAccessToken();
        if (!token) return;

        // Real payouts from the Invoice/escrow flow (source of truth), not the
        // legacy /stripe/worker/history which reads the dead Clerk-era table.
        const data = await api.getWorkerEarningsPayments();
        setPayments(data);
      } catch (error) {
        console.error("Erreur lors du chargement des paiements:", error);
        toast.error("Impossible de charger les paiements");
      } finally {
        setIsLoadingPayments(false);
      }
    };

    loadPayments();
  }, [authLoading, isAuthenticated, isOnboarded]);

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return (
          <span className="rounded-full bg-workon-trust-green/15 border border-workon-trust-green/25 px-3 py-1 text-xs font-semibold text-workon-trust-green">
            Payé
          </span>
        );
      case "PENDING":
        return (
          <span className="rounded-full bg-yellow-500/15 border border-yellow-500/25 px-3 py-1 text-xs font-semibold text-yellow-300">
            En attente
          </span>
        );
      case "FAILED":
        return (
          <span className="rounded-full bg-workon-accent/15 border border-workon-accent/25 px-3 py-1 text-xs font-semibold text-workon-accent">
            Échoué
          </span>
        );
      default:
        return null;
    }
  };

  const totalEarned = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.netAmountCents, 0);

  if (isLoadingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-workon-bg">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-workon-primary border-t-transparent"></div>
          <p className="text-workon-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-workon-bg p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-workon-ink">
            Mes Paiements
          </h1>
          <p className="text-lg text-workon-muted">
            Gérez vos paiements et votre compte Stripe
          </p>
        </div>

        {/* Banner Onboarding */}
        {!isOnboarded && !showEmbedded && (
          <div className="mb-8 rounded-3xl border border-workon-primary/30 bg-gradient-to-br from-workon-primary/15 via-workon-primary/5 to-transparent p-8 shadow-sm ">
            <CreditCard className="mb-4 h-12 w-12 text-workon-primary" />
            <h2 className="mb-3 text-2xl font-bold text-workon-ink">
              Configure tes paiements
            </h2>
            <p className="mb-6 text-workon-muted">
              Pour recevoir ton argent directement sur ton compte bancaire,
              configure ton compte de paiement. Ça prend quelques minutes — à
              faire une seule fois.
            </p>
            <Button onClick={() => setShowEmbedded(true)} variant="hero" size="hero">
              Configurer mes paiements
            </Button>
          </div>
        )}

        {/* Onboarding EMBARQUÉ — composants Connect dans WorkOn, sans redirection */}
        {!isOnboarded && showEmbedded && (
          <div className="mb-8 rounded-3xl border border-workon-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-workon-ink">
              Configure tes paiements
            </h2>
            <EmbeddedConnectOnboarding onComplete={() => window.location.reload()} />
          </div>
        )}

        {/* Stats Cards */}
        {isOnboarded && (
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-workon-trust-green/20 bg-gradient-to-br from-workon-trust-green/10 via-workon-trust-green/5 to-transparent p-6  shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <Banknote className="h-7 w-7 text-workon-trust-green" />
                <span className="text-3xl font-bold text-workon-trust-green">
                  {formatAmount(totalEarned)} $
                </span>
              </div>
              <h4 className="text-lg font-semibold text-workon-ink">Total gagné</h4>
              <p className="text-sm text-workon-muted">Paiements reçus</p>
            </div>

            <div className="rounded-3xl border border-workon-border bg-white p-6  shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <BarChart3 className="h-7 w-7 text-workon-ink" />
                <span className="text-3xl font-bold text-workon-ink">
                  {payments.filter((p) => p.status === "SUCCEEDED").length}
                </span>
              </div>
              <h4 className="text-lg font-semibold text-workon-ink">
                Paiements reçus
              </h4>
              <p className="text-sm text-workon-muted">Missions payées</p>
            </div>

            <div className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent p-6  shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <Clock className="h-7 w-7 text-yellow-500" />
                <span className="text-3xl font-bold text-yellow-600">
                  {payments.filter((p) => p.status === "PENDING").length}
                </span>
              </div>
              <h4 className="text-lg font-semibold text-workon-ink">En attente</h4>
              <p className="text-sm text-workon-muted">À recevoir</p>
            </div>
          </div>
        )}

        {/* Historique Paiements */}
        {isOnboarded && (
          <div className="rounded-3xl border border-workon-border bg-white  p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-workon-ink">
              Historique des paiements
            </h2>

            {isLoadingPayments ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl border border-workon-border bg-workon-bg0"
                  />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="mb-4 h-12 w-12 text-workon-gray/40" />
                <p className="mb-2 text-lg font-semibold text-workon-ink">
                  Aucun paiement encore
                </p>
                <p className="text-workon-muted">
                  Les paiements de vos missions complétées apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-2xl border border-workon-border bg-white/60 p-4 transition-all hover:border-workon-primary/40 hover:-translate-y-0.5"
                  >
                    <div className="flex-1">
                      <h4 className="mb-1 font-semibold text-workon-ink">
                        {payment.missionTitle}
                      </h4>
                      <div className="flex flex-wrap gap-3 text-sm text-workon-muted">
                        {payment.missionCategory && (
                          <span>{payment.missionCategory}</span>
                        )}
                        {payment.completedAt && (
                          <span>
                            {format(new Date(payment.completedAt), "PP", {
                              locale: frCA,
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <div className="mb-1 text-2xl font-bold text-workon-trust-green">
                        {formatAmount(payment.netAmountCents)} $
                      </div>
                      <div className="mb-2 text-xs text-workon-muted">
                        (Frais: {formatAmount(payment.feeCents)} $)
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lien retour */}
        <div className="mt-8 text-center">
          <Link
            href="/worker/dashboard"
            className="text-sm text-workon-muted transition hover:text-workon-accent"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

