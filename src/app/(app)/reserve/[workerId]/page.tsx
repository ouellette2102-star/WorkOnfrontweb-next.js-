"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Shield, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReservePage() {
  const { workerId } = useParams<{ workerId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    price: "",
    city: user?.city || "",
    address: "",
  });

  const { data: worker, isLoading } = useQuery({
    queryKey: ["worker", workerId],
    queryFn: () => api.getWorker(workerId),
    enabled: !!workerId,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  async function handleReserve() {
    if (!form.title || !form.price) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }
    setLoading(true);
    try {
      const mission = await api.createMission({
        title: form.title,
        description: form.description || form.title,
        category: form.category,
        price: Number(form.price),
        city: form.city || "Montréal",
        address: form.address,
        latitude: 45.5017,
        longitude: -73.5673,
      });
      toast.success("Mission créée! Le professionnel sera notifié.");
      router.push(`/missions/${mission.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-accent" />
      </div>
    );
  }

  if (!worker) {
    return <div className="text-center py-12 text-white/60">Professionnel non trouvé</div>;
  }

  const fullName = worker.fullName || `${worker.firstName} ${worker.lastName}`;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">Réservez en 1 tap</h1>
      <p className="text-white/60 text-sm">Contrat clair. Paiement sécurisé. Confirmation rapide.</p>

      {/* Worker summary card */}
      <div className="rounded-xl border border-white/10 bg-neutral-800/80 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-bold overflow-hidden">
            {worker.photoUrl ? (
              <img src={worker.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              `${worker.firstName[0]}${worker.lastName[0]}`
            )}
          </div>
          <div>
            <p className="font-semibold">{fullName}</p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < Math.round(worker.averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white/20",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-white/50">
                {worker.averageRating.toFixed(1)} ({worker.reviewCount} avis)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-green-400" />
            Fiable
          </span>
          <span>{worker.completionPercentage}% complétion</span>
          {worker.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {worker.city}
            </span>
          )}
        </div>
      </div>

      {/* Mission form */}
      <div className="space-y-4">
        <h2 className="font-semibold">Détails du contrat</h2>

        <div className="space-y-2">
          <Label>Type de service</Label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full h-10 rounded-lg border border-white/10 bg-neutral-800 px-3 text-sm text-white"
          >
            {categories?.map((c) => (
              <option key={c.id} value={c.name}>
                {c.icon} {c.name}
              </option>
            )) || <option value="other">Autre</option>}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Titre de la mission</Label>
          <Input
            placeholder="Ex: Entretien paysager"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Description (optionnel)</Label>
          <Textarea
            placeholder="Détails supplémentaires..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Budget ($)</Label>
          <Input
            type="number"
            placeholder="150"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Adresse</Label>
          <Input
            placeholder="Adresse exacte demandée après confirmation"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
      </div>

      {/* CTA */}
      <Button onClick={handleReserve} className="w-full h-12 text-base" disabled={loading}>
        <Shield className="h-4 w-4 mr-1" />
        {loading ? "Réservation..." : "Payer le dépôt sécurisé (Stripe)"}
      </Button>

      <div className="text-center text-xs text-white/40 space-y-1">
        <p>Paiement sécurisé par Stripe.</p>
        <p>WorkOn fournit l&apos;infrastructure de mise en relation et paiement.</p>
      </div>
    </div>
  );
}
