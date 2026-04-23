"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * CreateMissionForm — wires straight to `api.createMission` → POST
 * `/missions-local`, the canonical backend endpoint.
 *
 * History: this form used to route through the broken
 * `missions-api.createMission` shim which did a GET against
 * `/missions/create` (wrong method, wrong path, dropped payload). The
 * call returned 404 or a wrong-typed object and the form appeared to
 * succeed but no mission was ever persisted. Fixed as P0 blocker #2
 * from the Phase 5 audit.
 *
 * Backend contract (verified in api-client.ts:345):
 *   POST /missions-local
 *   body: { title, description, category, price, latitude, longitude,
 *           city, address? }
 *
 * Required fields the form MUST collect: title, description, category,
 * price, city, latitude, longitude. Previously the form silently left
 * category/city/lat/lng empty, which would have been rejected by the
 * backend anyway — so the shim bug was masked by a second validation
 * bug. Both are fixed in this PR.
 */

const CATEGORIES = [
  { value: "cleaning", label: "Ménage" },
  { value: "construction", label: "Construction" },
  { value: "renovation", label: "Rénovation" },
  { value: "plumbing", label: "Plomberie" },
  { value: "electrical", label: "Électricité" },
  { value: "painting", label: "Peinture" },
  { value: "gardening", label: "Jardinage" },
  { value: "moving", label: "Déménagement" },
  { value: "other", label: "Autre" },
] as const;

// Fallback centroid (Montréal) used when geolocation is denied or
// unavailable. The backend uses these for nearby-search so a sensible
// default is better than rejecting the whole submission.
const MONTREAL_FALLBACK = { latitude: 45.5017, longitude: -73.5673 };

async function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return MONTREAL_FALLBACK;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(MONTREAL_FALLBACK),
      { enableHighAccuracy: false, timeout: 4000 },
    );
  });
}

export function CreateMissionForm() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    city: "",
    address: "",
    price: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation — match what the backend actually requires.
    if (!formData.title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }
    if (!formData.description.trim()) {
      setError("La description est obligatoire");
      return;
    }
    if (!formData.category) {
      setError("Choisis une catégorie");
      return;
    }
    if (!formData.city.trim()) {
      setError("La ville est obligatoire");
      return;
    }
    const priceNum = Number(formData.price);
    if (!formData.price || Number.isNaN(priceNum) || priceNum <= 0) {
      setError("Le budget doit être un montant supérieur à 0");
      return;
    }

    startTransition(async () => {
      try {
        if (authLoading) {
          setError("Authentification en cours. Réessaie dans un instant.");
          return;
        }

        const { latitude, longitude } = await getCurrentLocation();

        await api.createMission({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          price: priceNum,
          latitude,
          longitude,
          city: formData.city.trim(),
          address: formData.address.trim() || undefined,
        });

        setSuccess(true);
        setTimeout(() => {
          router.push("/missions/mine");
        }, 1000);
      } catch (apiError) {
        setError(
          apiError instanceof Error
            ? apiError.message
            : "Erreur lors de la création de la mission",
        );
      }
    });
  };

  if (success) {
    return (
      <div className="rounded-3xl border border-workon-trust-green/25 bg-workon-trust-green/10 p-8 text-center shadow-card">
        <div className="mb-4 text-4xl">✅</div>
        <h3 className="mb-2 text-xl font-semibold text-workon-ink">
          Mission créée avec succès !
        </h3>
        <p className="text-workon-gray">Redirection vers vos missions...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-workon-ink">
          Titre de la mission *
        </Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Ex: Rénovation de salle de bain"
          className="border-workon-border bg-white text-workon-ink focus:border-workon-primary"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-workon-ink">
          Description *
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Décris la mission en détail — ce qu'il y a à faire, le matériel fourni, la durée estimée…"
          className="min-h-[120px] border-workon-border bg-white text-workon-ink focus:border-workon-primary"
          rows={5}
          required
        />
      </div>

      {/* Catégorie */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-workon-ink">
          Catégorie *
        </Label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-workon-ink focus:border-workon-primary focus:outline-none"
          required
        >
          <option value="">Sélectionne une catégorie</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ville & Adresse */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-workon-ink">
            Ville *
          </Label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Montréal"
            className="border-workon-border bg-white text-workon-ink focus:border-workon-primary"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address" className="text-workon-ink">
            Adresse{" "}
            <span className="text-workon-muted text-xs font-normal">(facultatif)</span>
          </Label>
          <Input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="123 rue Exemple"
            className="border-workon-border bg-white text-workon-ink focus:border-workon-primary"
          />
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label htmlFor="price" className="text-workon-ink">
          Budget ($) *
        </Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => handleChange("price", e.target.value)}
          placeholder="150.00"
          className="border-workon-border bg-white text-workon-ink focus:border-workon-primary"
          required
        />
        <p className="text-xs text-workon-muted">
          Montant total bloqué en escrow Stripe jusqu&apos;à la validation de la mission.
        </p>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="rounded-2xl border border-workon-accent/30 bg-workon-accent/5 p-4 text-sm text-workon-accent">
          {error}
        </div>
      )}

      {/* Bouton Submit */}
      <Button
        type="submit"
        disabled={isPending}
        variant="hero"
        size="hero"
        className="w-full"
      >
        {isPending ? "Création en cours..." : "Créer la mission"}
      </Button>
    </form>
  );
}
