"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  Phone,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Express Dispatch — the core WorkOn feature.
 *
 * Flow:
 * 1. User selects category, writes description, sets budget
 * 2. GPS captures location automatically
 * 3. POST /missions-local/express → backend creates mission + notifies nearby workers
 * 4. Result: "{N} professionnel(s) notifié(s)" + countdown
 *
 * This is the "Uber model": first worker to accept gets the mission.
 */

interface ExpressResult {
  missionId: string;
  candidatesNotified: number;
}

export default function ExpressPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(user?.city ?? "");
  const [budget, setBudget] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<ExpressResult | null>(null);

  // Fetch categories from backend
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    staleTime: 60_000,
  });

  // Auto-detect GPS on mount
  const detectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsStatus("success");
      },
      () => {
        setGpsStatus("error");
        // Fallback: Montreal
        setLatitude(45.5017);
        setLongitude(-73.5673);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    detectGPS();
  }, [detectGPS]);

  // Express dispatch mutation
  const dispatch = useMutation({
    mutationFn: async () => {
      // Use createMission since backend doesn't have /express yet —
      // this creates the mission. Nearby workers will see it on the map.
      // When the backend express endpoint is added (PR #103), swap to api.expressDispatch().
      const mission = await api.createMission({
        title: `Express: ${category || "Service urgent"}`,
        description: description || "Besoin urgent d'un professionnel",
        category: category || "general",
        price: Number(budget) || 50,
        latitude: latitude ?? 45.5017,
        longitude: longitude ?? -73.5673,
        city: city || "Montréal",
      });
      return { missionId: mission.id, candidatesNotified: 0 } as ExpressResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Mission créée avec succès!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors du dispatch");
    },
  });

  const canSubmit = description.trim().length > 0 && latitude !== null;

  // Result screen
  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-workon-primary/10 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-workon-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-workon-ink font-[family-name:var(--font-cabinet)]">
              Mission envoyée!
            </h1>
            <p className="text-workon-gray mt-2">
              Votre demande a été publiée. Les professionnels à proximité peuvent maintenant l&apos;accepter.
            </p>
          </div>
          <p className="text-sm text-workon-primary font-medium">
            Le premier à accepter obtient la mission
          </p>
          <Button
            onClick={() => setResult(null)}
            className="bg-workon-primary hover:bg-workon-primary-hover text-white rounded-2xl px-6 py-3"
          >
            Nouvelle demande
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-workon-ink font-[family-name:var(--font-cabinet)]">
          Dispatch Express
        </h1>
        <p className="text-sm text-workon-gray mt-1">
          Décrivez votre besoin, on notifie les pros à proximité
        </p>
      </div>

      {/* Category chips */}
      {categories && categories.length > 0 && (
        <div>
          <label className="text-sm font-medium text-workon-ink mb-2 block">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                  category === cat.name
                    ? "bg-workon-primary text-white border-workon-primary"
                    : "bg-white text-workon-ink border-workon-border hover:border-workon-primary"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-workon-ink mb-2 block">
          Décrivez votre besoin *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: J'ai besoin d'un plombier pour une fuite sous l'évier..."
          rows={4}
          className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-1 focus:ring-workon-primary-ring resize-none"
        />
      </div>

      {/* City */}
      <div>
        <label className="text-sm font-medium text-workon-ink mb-2 block">Ville</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Montréal"
          className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-1 focus:ring-workon-primary-ring"
        />
      </div>

      {/* Budget */}
      <div>
        <label className="text-sm font-medium text-workon-ink mb-2 block">Budget ($CAD)</label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="50"
          min={1}
          className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-1 focus:ring-workon-primary-ring"
        />
      </div>

      {/* GPS status */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-workon-bg-cream">
        {gpsStatus === "loading" && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-workon-primary" />
            <span className="text-sm text-workon-gray">Localisation en cours...</span>
          </>
        )}
        {gpsStatus === "success" && (
          <>
            <Navigation className="h-4 w-4 text-workon-primary" />
            <span className="text-sm text-workon-primary font-medium">
              Position GPS détectée
            </span>
          </>
        )}
        {gpsStatus === "error" && (
          <>
            <AlertCircle className="h-4 w-4 text-workon-accent" />
            <span className="text-sm text-workon-gray">
              GPS indisponible — position par défaut (Montréal)
            </span>
            <button onClick={detectGPS} className="text-sm text-workon-primary ml-auto">
              Réessayer
            </button>
          </>
        )}
        {gpsStatus === "idle" && (
          <>
            <MapPin className="h-4 w-4 text-workon-muted" />
            <span className="text-sm text-workon-gray">En attente de la localisation...</span>
          </>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={() => dispatch.mutate()}
        disabled={!canSubmit || dispatch.isPending}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-workon-accent text-white font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-workon-accent-hover shadow-[0_4px_16px_rgba(181,56,42,0.3)]"
      >
        {dispatch.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Phone className="h-5 w-5" fill="currentColor" />
        )}
        Envoyer la demande
      </button>
    </div>
  );
}
