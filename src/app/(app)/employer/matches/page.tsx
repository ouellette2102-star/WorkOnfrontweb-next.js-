"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function EmployerMatchesPage() {
  const router = useRouter();
  const {
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-matches"],
    queryFn: () => api.getMatches(),
  });

  return (
    <div className="min-h-screen bg-workon-bg p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-workon-ink">Mes matches</h1>
          <p className="text-lg text-workon-muted">
            Travailleurs compatibles avec votre profil
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-workon-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600">Erreur lors du chargement des matches</p>
          </div>
        )}

        {matches && matches.length === 0 && (
          <div className="rounded-2xl border border-workon-border bg-white p-12 text-center">
            <div className="mb-4 text-6xl">🤝</div>
            <h3 className="mb-2 text-xl font-semibold text-workon-ink">
              Aucun match pour le moment
            </h3>
            <p className="mb-6 text-workon-muted">
              Découvrez des travailleurs pour créer des matches
            </p>
            <Button asChild className="bg-workon-primary hover:bg-workon-primary/90 text-white">
              <Link href="/employer/discover">Découvrir des travailleurs</Link>
            </Button>
          </div>
        )}

        {matches && matches.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} router={router} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  router,
}: {
  match: {
    id: string;
    matchedUser: { id: string; firstName: string; lastName: string; city: string | null; pictureUrl: string | null };
    status: "ACTIVE" | "EXPIRED";
    createdAt: string;
  };
  router: ReturnType<typeof useRouter>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  const createMission = useMutation({
    mutationFn: () =>
      api.createMissionFromMatch(match.id, {
        title: title.trim() || "Mission depuis match",
        category: "other",
        price: price ? parseFloat(price) : 0,
      }),
    onSuccess: (mission) => {
      toast.success("Mission créée depuis le match!");
      router.push(`/missions/${mission.id}`);
    },
    onError: () => {
      toast.error("Erreur lors de la création de la mission");
    },
  });

  return (
    <div className="rounded-2xl border border-workon-border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-center gap-4">
        {match.matchedUser.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={match.matchedUser.pictureUrl}
            alt={match.matchedUser.firstName}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-workon-primary/10 text-lg font-bold text-workon-primary">
            {match.matchedUser.firstName[0]}
            {match.matchedUser.lastName[0]}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-workon-ink">
            {match.matchedUser.firstName} {match.matchedUser.lastName}
          </h3>
          {match.matchedUser.city && (
            <p className="text-sm text-workon-muted">
              {match.matchedUser.city}
            </p>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-workon-muted">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            match.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"
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

      {/* Toggle optional form */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="mb-3 flex w-full items-center justify-between rounded-lg border border-workon-border bg-workon-bg px-3 py-2 text-sm text-workon-muted hover:bg-gray-100 transition-colors"
      >
        <span>Personnaliser (optionnel)</span>
        {showForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showForm && (
        <div className="mb-4 space-y-3 rounded-lg border border-workon-border bg-workon-bg p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-workon-muted">
              Titre de la mission
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Nettoyage résidentiel"
              className="border-workon-border bg-white text-workon-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-workon-muted">
              Prix ($CAD)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 150.00"
              className="border-workon-border bg-white text-workon-ink"
            />
          </div>
        </div>
      )}

      <Button
        onClick={() => createMission.mutate()}
        disabled={createMission.isPending}
        className="w-full bg-workon-primary hover:bg-workon-primary/90 text-white"
      >
        {createMission.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="mr-2 h-4 w-4" />
        )}
        Créer une mission
      </Button>
    </div>
  );
}
