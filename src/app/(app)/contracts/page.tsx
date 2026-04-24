"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ContractResponse } from "@/lib/api-client";
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

export default function ContractsPage() {
  const { data: contracts, isLoading, error } = useQuery({
    queryKey: ["my-contracts"],
    queryFn: () => api.getMyContracts(),
  });

  return (
    <div className="min-h-screen bg-workon-bg p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-workon-ink">Mes contrats</h1>
          <p className="text-lg text-workon-muted">
            Consultez et gérez vos contrats
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">Erreur lors du chargement des contrats</p>
          </div>
        )}

        {contracts && contracts.length === 0 && (
          <div className="rounded-3xl border border-workon-border bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-6xl">📄</div>
            <h3 className="mb-2 text-xl font-semibold text-workon-ink">
              Aucun contrat
            </h3>
            <p className="text-workon-muted">
              Vos contrats apparaîtront ici une fois créés
            </p>
          </div>
        )}

        {contracts && contracts.length > 0 && (
          <div className="space-y-4">
            {contracts.map((contract) => {
              const status = statusConfig[contract.status];
              return (
                <Link key={contract.id} href={`/contracts/${contract.id}`}>
                  <div className="group cursor-pointer rounded-2xl border border-workon-border bg-white p-6 shadow-sm transition hover:border-workon-primary/50">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 text-lg font-semibold text-workon-ink">
                          Contrat #{contract.id.slice(0, 8)}
                        </h3>
                        {contract.localMissionId && (
                          <p className="text-sm text-workon-muted">
                            Mission : {contract.localMissionId.slice(0, 8)}...
                          </p>
                        )}
                        <p className="mt-2 text-sm text-workon-muted">
                          Créé le{" "}
                          {new Date(contract.createdAt).toLocaleDateString("fr-CA")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    {contract.terms && (
                      <p className="mt-3 line-clamp-2 text-sm text-workon-muted">
                        {contract.terms}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
