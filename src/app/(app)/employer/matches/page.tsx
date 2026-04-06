"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type SwipeMatch } from "@/lib/api-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EmployerMatchesPage() {
  const {
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-matches"],
    queryFn: () => api.getMatches(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">Mes matches</h1>
          <p className="text-lg text-white/70">
            Travailleurs compatibles avec votre profil
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">Erreur lors du chargement des matches</p>
          </div>
        )}

        {matches && matches.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-12 text-center backdrop-blur">
            <div className="mb-4 text-6xl">&#x1F91D;</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Aucun match pour le moment
            </h3>
            <p className="mb-6 text-white/70">
              D\u00e9couvrez des travailleurs pour cr\u00e9er des matches
            </p>
            <Link href="/employer/discover">
              <Button className="bg-green-600 hover:bg-green-500">
                D\u00e9couvrir des travailleurs
              </Button>
            </Link>
          </div>
        )}

        {matches && matches.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur"
              >
                <div className="mb-4 flex items-center gap-4">
                  {match.matchedUser.pictureUrl ? (
                    <img
                      src={match.matchedUser.pictureUrl}
                      alt={match.matchedUser.firstName}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600/20 text-lg font-bold text-green-400">
                      {match.matchedUser.firstName[0]}
                      {match.matchedUser.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {match.matchedUser.firstName} {match.matchedUser.lastName}
                    </h3>
                    {match.matchedUser.city && (
                      <p className="text-sm text-white/60">
                        {match.matchedUser.city}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 text-sm text-white/50">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      match.status === "ACTIVE" ? "bg-green-500" : "bg-neutral-500"
                    }`}
                  />
                  <span>
                    {match.status === "ACTIVE" ? "Actif" : "Expir\u00e9"}
                  </span>
                  <span>&middot;</span>
                  <span>
                    Match\u00e9 le{" "}
                    {new Date(match.createdAt).toLocaleDateString("fr-CA")}
                  </span>
                </div>

                <Link href="/missions/new">
                  <Button className="w-full rounded-xl bg-green-600 hover:bg-green-500">
                    Cr\u00e9er une mission
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
