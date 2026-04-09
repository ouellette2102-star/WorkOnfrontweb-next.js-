"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
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
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF4D1C] border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-[#FF4D1C]/30 bg-[#FF4D1C]/5 p-6 text-center shadow-lg shadow-black/20">
            <p className="text-[#FF4D1C]">Erreur lors du chargement des matches</p>
          </div>
        )}

        {matches && matches.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#FF4D1C]/15 via-[#FF4D1C]/5 to-transparent backdrop-blur-sm p-12 text-center shadow-lg shadow-black/20">
            <div className="mb-4 text-6xl">🤝</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Aucun match pour le moment
            </h3>
            <p className="mb-6 text-white/70">
              Découvrez des travailleurs pour créer des matches
            </p>
            <Button asChild variant="hero" size="hero">
              <Link href="/employer/discover">Découvrir des travailleurs</Link>
            </Button>
          </div>
        )}

        {matches && matches.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <div
                key={match.id}
                className="rounded-3xl border border-white/10 bg-neutral-800/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-[#FF4D1C]/30 hover:shadow-xl hover:shadow-[#FF4D1C]/10"
              >
                <div className="mb-4 flex items-center gap-4">
                  {match.matchedUser.pictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={match.matchedUser.pictureUrl}
                      alt={match.matchedUser.firstName}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF4D1C]/15 border border-[#FF4D1C]/25 text-lg font-bold text-[#FF4D1C]">
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
                      match.status === "ACTIVE" ? "bg-[#22C55E]" : "bg-white/30"
                    }`}
                  />
                  <span>
                    {match.status === "ACTIVE" ? "Actif" : "Expiré"}
                  </span>
                  <span>&middot;</span>
                  <span>
                    Matché le{" "}
                    {new Date(match.createdAt).toLocaleDateString("fr-CA")}
                  </span>
                </div>

                <Button asChild variant="hero" size="sm" className="w-full">
                  <Link href="/missions/new">Créer une mission</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
