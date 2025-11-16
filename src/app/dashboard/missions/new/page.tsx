"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewMissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement mission creation
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard/client/home");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Publier une mission</h1>
          <p className="text-white/70 mt-2">
            Décris ta mission et trouve le travailleur parfait
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Détails de la mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Remplacement Caissier 4h ce soir"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Décris les tâches à effectuer..."
                  rows={5}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionne une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peinture">Peinture</SelectItem>
                    <SelectItem value="plomberie">Plomberie</SelectItem>
                    <SelectItem value="electricite">Électricité</SelectItem>
                    <SelectItem value="divers">Divers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priceType">Type de prix</Label>
                <Select name="priceType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Fixe ou horaire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Prix fixe</SelectItem>
                    <SelectItem value="HOURLY">Taux horaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetMin">Budget min ($)</Label>
                  <Input
                    id="budgetMin"
                    name="budgetMin"
                    type="number"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="budgetMax">Budget max ($)</Label>
                  <Input
                    id="budgetMax"
                    name="budgetMax"
                    type="number"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Adresse</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="123 Rue Example, Montréal, QC"
                  required
                />
              </div>

              <div className="bg-white/5 rounded-lg p-4 text-sm text-white/80">
                <p>
                  <strong>Note légale:</strong> En publiant cette mission, tu
                  acceptes que le travailleur soit un{" "}
                  <strong>travailleur autonome</strong>, non un employé.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Publication..." : "Publier la mission"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

