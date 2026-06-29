"use client";

import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight, AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { api, type InvoiceResponse } from "@/lib/api-client";
import { trackEvent } from "@/lib/analytics";

type Status = "loading" | "confirmed" | "pending" | "failed" | "no-session";

// ~30s total: 1.5s, 2s, 2.5s, 3s, 4s, 5s, 6s, 6s, 6s, 6s
const POLL_DELAYS_MS = [1500, 2000, 2500, 3000, 4000, 5000, 6000, 6000, 6000, 6000];

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency }).format(
    value,
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const invoiceId = searchParams.get("invoice_id");

  const [status, setStatus] = useState<Status>("loading");
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cancelledRef = useRef(false);
  const retryKeyRef = useRef(0);
  const trackedRef = useRef(false);

  const handleDownloadPdf = async () => {
    if (!invoiceId) return;
    setDownloading(true);
    try {
      await api.downloadInvoicePdf(invoiceId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Téléchargement échoué");
    } finally {
      setDownloading(false);
    }
  };

  const poll = useCallback(async () => {
    if (!sessionId) {
      setStatus("no-session");
      return;
    }

    cancelledRef.current = false;
    const myKey = ++retryKeyRef.current;
    setStatus("loading");

    for (let attempt = 0; attempt < POLL_DELAYS_MS.length; attempt++) {
      if (cancelledRef.current || retryKeyRef.current !== myKey) return;

      try {
        if (invoiceId) {
          const inv = await api.getInvoice(invoiceId);
          if (inv.status === "PAID") {
            setInvoice(inv);
            setStatus("confirmed");
            return;
          }
          if (inv.status === "FAILED" || inv.status === "CANCELLED") {
            setStatus("failed");
            return;
          }
        } else {
          // Legacy fallback: subscription flow without invoice_id
          const sub = await api.getSubscription();
          if (sub && sub.plan !== "FREE") {
            setStatus("confirmed");
            return;
          }
        }
      } catch {
        // Network / webhook race — keep polling
      }

      await new Promise((r) => setTimeout(r, POLL_DELAYS_MS[attempt]));
    }

    if (!cancelledRef.current && retryKeyRef.current === myKey) {
      setStatus("pending");
    }
  }, [sessionId, invoiceId]);

  useEffect(() => {
    poll();
    return () => {
      cancelledRef.current = true;
    };
  }, [poll]);

  // Fire the F4 funnel event once, only on a real terminal outcome from the
  // poll above (PAID → succeeded, FAILED/CANCELLED → failed). Never on the
  // loading/pending/no-session states, so the count stays honest.
  useEffect(() => {
    if (trackedRef.current) return;
    if (status === "confirmed") {
      trackedRef.current = true;
      trackEvent("payment_succeeded", { source: invoiceId ? "invoice" : "subscription" });
    } else if (status === "failed") {
      trackedRef.current = true;
      trackEvent("payment_failed", { source: invoiceId ? "invoice" : "subscription" });
    }
  }, [status, invoiceId]);

  const handleRetry = () => {
    poll();
  };

  return (
    <div className="min-h-screen bg-workon-bg p-6 flex items-center justify-center">
      <div className="mx-auto max-w-md w-full">
        <div
          className={`rounded-2xl border bg-white p-10 text-center shadow-sm ${
            status === "no-session" || status === "failed"
              ? "border-red-200"
              : status === "pending"
              ? "border-amber-200"
              : "border-green-200"
          }`}
        >
          {status === "loading" && (
            <>
              <div className="mb-5 flex justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-workon-primary" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-workon-ink">
                Vérification en cours…
              </h1>
              <p className="text-base text-workon-muted">
                On confirme ton paiement avec Stripe.
              </p>
            </>
          )}

          {status === "confirmed" && (
            <>
              <div className="mb-5 flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-workon-ink">
                Paiement confirmé !
              </h1>
              {invoice ? (
                <>
                  <p className="mb-4 text-base text-workon-muted">
                    Facture{" "}
                    <span className="font-mono">
                      {invoice.invoiceNumber ?? ""}
                    </span>{" "}
                    — ton reçu arrive aussi par courriel.
                  </p>
                  <div className="mb-6 rounded-2xl border border-workon-border bg-workon-bg p-4 text-left text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-workon-muted">Sous-total</span>
                      <span className="text-workon-ink">
                        {formatAmount(invoice.subtotal, invoice.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-workon-muted">Frais + taxes</span>
                      <span className="text-workon-ink">
                        {formatAmount(
                          invoice.platformFee + invoice.taxes,
                          invoice.currency,
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between border-t border-workon-border pt-2 text-base font-bold">
                      <span className="text-workon-ink">Total payé</span>
                      <span className="text-green-600">
                        {formatAmount(invoice.total, invoice.currency)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="mb-6 text-base text-workon-muted">
                  Ton paiement a été reçu. Tu peux consulter ton reçu en tout
                  temps.
                </p>
              )}
            </>
          )}

          {status === "pending" && (
            <>
              <div className="mb-5 flex justify-center">
                <AlertTriangle className="h-16 w-16 text-amber-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-workon-ink">
                Paiement en traitement
              </h1>
              <p className="mb-6 text-base text-workon-muted">
                Stripe a reçu ton paiement mais la confirmation met plus de temps que prévu.
                Tu peux réessayer ou consulter tes reçus dans quelques minutes.
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="mb-5 flex justify-center">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-workon-ink">
                Paiement non complété
              </h1>
              <p className="mb-6 text-base text-workon-muted">
                Le paiement n&apos;a pas abouti. Aucun montant n&apos;a été débité.
                Tu peux réessayer depuis la mission.
              </p>
            </>
          )}

          {status === "no-session" && (
            <>
              <div className="mb-5 flex justify-center">
                <AlertTriangle className="h-16 w-16 text-red-400" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-workon-ink">
                Lien invalide
              </h1>
              <p className="mb-6 text-base text-workon-muted">
                Cette page n&apos;est accessible que depuis une redirection Stripe valide.
              </p>
            </>
          )}

          {status !== "loading" && (
            <div className="flex flex-col items-center gap-3 mt-4">
              {status === "pending" && (
                <Button onClick={handleRetry} className="w-full" variant="secondary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer la vérification
                </Button>
              )}

              {status === "confirmed" && invoiceId && (
                <Button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="w-full"
                >
                  {downloading
                    ? "Génération…"
                    : "Télécharger la facture (PDF)"}
                </Button>
              )}

              {(status === "confirmed" || status === "pending") && (
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/receipts" className="inline-flex items-center justify-center gap-2">
                    Voir mes reçus
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              {status === "failed" && (
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/missions" className="inline-flex items-center justify-center gap-2">
                    Retour à mes missions
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              <Link
                href="/home"
                className="text-sm text-workon-muted hover:text-workon-ink transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-workon-bg">
          <Loader2 className="h-10 w-10 animate-spin text-workon-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
