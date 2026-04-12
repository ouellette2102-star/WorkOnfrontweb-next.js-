"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ContractResponse } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

const statusConfig: Record<
  ContractResponse["status"],
  { label: string; className: string }
> = {
  DRAFT: { label: "Brouillon", className: "bg-neutral-600 text-white" },
  PENDING: { label: "En attente", className: "bg-yellow-600 text-white" },
  ACCEPTED: { label: "Accept\u00e9", className: "bg-green-600 text-white" },
  REJECTED: { label: "Refus\u00e9", className: "bg-red-600 text-white" },
  COMPLETED: { label: "Compl\u00e9t\u00e9", className: "bg-blue-600 text-white" },
  CANCELLED: { label: "Annul\u00e9", className: "bg-neutral-500 text-white" },
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contractId = params.id as string;

  const {
    data: contract,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => api.getContract(contractId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.updateContractStatus(contractId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      queryClient.invalidateQueries({ queryKey: ["my-contracts"] });
      toast.success("Statut du contrat mis \u00e0 jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise \u00e0 jour du statut");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-workon-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-workon-bg p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="mb-4 text-red-400">Contrat introuvable</p>
          <Link href="/contracts">
            <Button variant="outline">Retour aux contrats</Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[contract.status];

  return (
    <div className="min-h-screen bg-workon-bg p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/contracts"
          className="mb-6 inline-block text-sm text-workon-muted transition hover:text-workon-primary"
        >
          &larr; Retour aux contrats
        </Link>

        <div className="rounded-3xl border border-workon-border bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-workon-ink">
                Contrat #{contract.id.slice(0, 8)}
              </h1>
              <p className="text-sm text-workon-muted">
                Cr\u00e9\u00e9 le{" "}
                {new Date(contract.createdAt).toLocaleDateString("fr-CA")}
              </p>
            </div>
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          {/* Details */}
          <div className="mb-6 space-y-4">
            {contract.localMissionId && (
              <div>
                <p className="text-sm text-workon-muted">Mission associ\u00e9e</p>
                <p className="text-workon-ink">{contract.localMissionId}</p>
              </div>
            )}
            {contract.missionId && (
              <div>
                <p className="text-sm text-workon-muted">Mission (legacy)</p>
                <p className="text-workon-ink">{contract.missionId}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-workon-muted">Derni\u00e8re mise \u00e0 jour</p>
              <p className="text-white">
                {new Date(contract.updatedAt).toLocaleDateString("fr-CA")}
              </p>
            </div>
          </div>

          {/* Terms */}
          {contract.terms && (
            <div className="mb-6 rounded-2xl border border-workon-border bg-workon-bg p-4">
              <h3 className="mb-2 text-sm font-semibold text-workon-muted">
                Termes du contrat
              </h3>
              <p className="whitespace-pre-wrap text-workon-ink/80">
                {contract.terms}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {contract.status === "DRAFT" && (
              <Button
                onClick={() => statusMutation.mutate("PENDING")}
                disabled={statusMutation.isPending}
                className="bg-yellow-600 hover:bg-yellow-500"
              >
                {statusMutation.isPending ? "Envoi..." : "Envoyer"}
              </Button>
            )}

            {contract.status === "PENDING" && (
              <>
                <Button
                  onClick={() => statusMutation.mutate("ACCEPTED")}
                  disabled={statusMutation.isPending}
                  className="bg-green-600 hover:bg-green-500"
                >
                  Accepter
                </Button>
                <Button
                  onClick={() => statusMutation.mutate("REJECTED")}
                  disabled={statusMutation.isPending}
                  className="bg-red-600 hover:bg-red-500"
                >
                  Rejeter
                </Button>
              </>
            )}

            {contract.status === "ACCEPTED" && (
              <>
                <Button
                  onClick={() => statusMutation.mutate("COMPLETED")}
                  disabled={statusMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-500"
                >
                  Compl\u00e9ter
                </Button>
                <Button
                  onClick={() => statusMutation.mutate("CANCELLED")}
                  disabled={statusMutation.isPending}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Annuler
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
