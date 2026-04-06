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
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">Mes contrats</h1>
          <p className="text-lg text-white/70">
            Consultez et g\u00e9rez vos contrats
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
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-12 text-center backdrop-blur">
            <div className="mb-4 text-6xl">📄</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Aucun contrat
            </h3>
            <p className="text-white/70">
              Vos contrats appara\u00eetront ici une fois cr\u00e9\u00e9s
            </p>
          </div>
        )}

        {contracts && contracts.length > 0 && (
          <div className="space-y-4">
            {contracts.map((contract) => {
              const status = statusConfig[contract.status];
              return (
                <Link key={contract.id} href={`/contracts/${contract.id}`}>
                  <div className="group cursor-pointer rounded-2xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-green-500/50 hover:bg-neutral-900">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 text-lg font-semibold text-white">
                          Contrat #{contract.id.slice(0, 8)}
                        </h3>
                        {contract.localMissionId && (
                          <p className="text-sm text-white/60">
                            Mission : {contract.localMissionId.slice(0, 8)}...
                          </p>
                        )}
                        <p className="mt-2 text-sm text-white/50">
                          Cr\u00e9\u00e9 le{" "}
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
                      <p className="mt-3 line-clamp-2 text-sm text-white/60">
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
