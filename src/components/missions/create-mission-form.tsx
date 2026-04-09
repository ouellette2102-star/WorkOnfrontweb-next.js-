"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { createMission } from "@/lib/missions-api";
import type { CreateMissionPayload } from "@/types/mission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const categories = [
  "Ménage",
  "Construction",
  "Rénovation",
  "Plomberie",
  "Électricité",
  "Peinture",
  "Jardinage",
  "Déménagement",
  "Autre",
];

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
    hourlyRate: "",
    startsAt: "",
  });

  const handleChange = (
    field: keyof typeof formData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation simple
    if (!formData.title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }

    if (formData.hourlyRate && Number(formData.hourlyRate) <= 0) {
      setError("Le taux horaire doit être supérieur à 0");
      return;
    }

    startTransition(async () => {
      try {
        if (authLoading) {
          setError("Authentification en cours. Réessaie dans un instant.");
          return;
        }

        const token = getAccessToken();
        if (!token) {
          setError("Impossible de récupérer le token. Reconnecte-toi.");
          return;
        }

        const payload: CreateMissionPayload = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category || undefined,
          city: formData.city.trim() || undefined,
          address: formData.address.trim() || undefined,
          hourlyRate: formData.hourlyRate
            ? Number(formData.hourlyRate)
            : undefined,
          startsAt: formData.startsAt || undefined,
        };

        await createMission(token, payload);
        setSuccess(true);

        // Redirection après 1 seconde
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
      <div className="rounded-3xl border border-[#22C55E]/25 bg-[#22C55E]/10 p-8 text-center shadow-lg shadow-black/20">
        <div className="mb-4 text-4xl">✅</div>
        <h3 className="mb-2 text-xl font-semibold text-white">
          Mission créée avec succès !
        </h3>
        <p className="text-white/70">Redirection vers vos missions...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white">
          Titre de la mission *
        </Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Ex: Rénovation de salle de bain"
          className="border-white/10 bg-neutral-900 text-white focus:border-[#FF4D1C]"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Décris la mission en détail..."
          className="min-h-[120px] border-white/10 bg-neutral-900 text-white focus:border-[#FF4D1C]"
          rows={5}
        />
      </div>

      {/* Catégorie */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-white">
          Catégorie
        </Label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-white focus:border-[#FF4D1C] focus:outline-none"
        >
          <option value="">Sélectionne une catégorie</option>
          {categories.map((cat) => (
            <option key={cat} value={cat.toLowerCase()}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Ville & Adresse */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-white">
            Ville
          </Label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Montréal"
            className="border-white/10 bg-neutral-900 text-white focus:border-[#FF4D1C]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address" className="text-white">
            Adresse
          </Label>
          <Input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="123 rue Exemple"
            className="border-white/10 bg-neutral-900 text-white focus:border-[#FF4D1C]"
          />
        </div>
      </div>

      {/* Taux horaire & Date */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hourlyRate" className="text-white">
            Taux horaire ($/h)
          </Label>
          <Input
            id="hourlyRate"
            type="number"
            step="0.01"
            min="0"
            value={formData.hourlyRate}
            onChange={(e) => handleChange("hourlyRate", e.target.value)}
            placeholder="25.00"
            className="border-white/10 bg-neutral-900 text-white focus:border-[#FF4D1C]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startsAt" className="text-white">
            Date de début
          </Label>
          <Input
            id="startsAt"
            type="date"
            value={formData.startsAt}
            onChange={(e) => handleChange("startsAt", e.target.value)}
            className="border-white/10 bg-neutral-900 text-white focus:border-[#FF4D1C]"
          />
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="rounded-2xl border border-[#FF4D1C]/30 bg-[#FF4D1C]/5 p-4 text-sm text-[#FF4D1C]">
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

