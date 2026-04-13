"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type RecurringTemplate } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Zap, Power, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const RECURRENCE_OPTIONS = [
  { value: "ONCE", label: "Une fois" },
  { value: "DAILY", label: "Quotidien" },
  { value: "WEEKLY", label: "Hebdomadaire" },
  { value: "BIWEEKLY", label: "Aux 2 semaines" },
  { value: "MONTHLY", label: "Mensuel" },
];

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [recurrence, setRecurrence] = useState("ONCE");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.getTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createTemplate({
        title,
        description,
        categoryId: category,
        price: parseFloat(price),
        recurrenceRule: recurrence,
        priceType: "FIXED",
        duration: 60,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Modele cree");
      setShowForm(false);
      setTitle("");
      setDescription("");
      setCategory("");
      setPrice("");
      setRecurrence("ONCE");
    },
    onError: () => toast.error("Erreur lors de la creation"),
  });

  const generateMutation = useMutation({
    mutationFn: (id: string) => api.generateFromTemplate(id),
    onSuccess: () => {
      toast.success("Missions generees avec succes");
    },
    onError: () => toast.error("Erreur lors de la generation"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.deactivateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Modele desactive");
    },
    onError: () => toast.error("Erreur lors de la desactivation"),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-workon-ink">Modeles recurrents</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-workon-primary hover:bg-workon-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 space-y-4 rounded-xl border border-workon-border bg-white shadow-sm p-4">
          <h3 className="text-lg font-semibold text-workon-ink">Creer un modele</h3>
          <div>
            <label className="mb-1 block text-xs text-workon-muted">Titre</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Menage hebdomadaire"
              className="border-workon-border bg-white text-workon-ink placeholder-workon-muted/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-workon-muted">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Decrivez la mission..."
              rows={3}
              className="w-full rounded-xl border border-workon-border bg-white shadow-sm p-3 text-workon-ink placeholder-workon-muted/50 focus:border-workon-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-workon-muted">Categorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-workon-border bg-white shadow-sm p-3 text-workon-ink focus:border-workon-primary focus:outline-none"
              >
                <option value="">Choisir...</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-workon-muted">Prix ($)</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="50.00"
                className="border-workon-border bg-white text-workon-ink placeholder-workon-muted/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-workon-muted">Recurrence</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full rounded-xl border border-workon-border bg-white shadow-sm p-3 text-workon-ink focus:border-workon-primary focus:outline-none"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!title || !category || !price || createMutation.isPending}
              className="bg-workon-primary hover:bg-workon-primary/90"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Creer"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Templates list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="rounded-xl border border-workon-border bg-white shadow-sm p-12 text-center">
          <RefreshCw className="mx-auto mb-4 h-12 w-12 text-workon-muted/50" />
          <h3 className="mb-2 text-lg font-semibold text-workon-ink">Aucun modele</h3>
          <p className="text-workon-muted">
            Creez des modeles pour generer automatiquement des missions recurrentes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onGenerate={() => generateMutation.mutate(template.id)}
              onDeactivate={() => deactivateMutation.mutate(template.id)}
              isGenerating={generateMutation.isPending}
              isDeactivating={deactivateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onGenerate,
  onDeactivate,
  isGenerating,
  isDeactivating,
}: {
  template: RecurringTemplate;
  onGenerate: () => void;
  onDeactivate: () => void;
  isGenerating: boolean;
  isDeactivating: boolean;
}) {
  const recLabel = RECURRENCE_OPTIONS.find((o) => o.value === template.recurrence)?.label || template.recurrence;

  return (
    <div className={`rounded-xl border p-4 ${template.isActive ? "border-workon-border bg-white shadow-sm" : "border-workon-border/50 bg-workon-bg opacity-60"}`}>
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-workon-ink">{template.title}</h3>
          <p className="text-sm text-workon-muted">{template.description}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs ${template.isActive ? "bg-green-500/20 text-green-400" : "bg-neutral-500/20 text-neutral-400"}`}>
          {template.isActive ? "Actif" : "Inactif"}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-workon-bg px-2 py-1 text-workon-muted">{template.category}</span>
        <span className="rounded-full bg-workon-bg px-2 py-1 text-workon-muted">{template.price.toFixed(2)} $</span>
        <span className="rounded-full bg-blue-500/20 px-2 py-1 text-blue-400">{recLabel}</span>
      </div>

      {template.isActive && (
        <div className="flex gap-2">
          <Button size="sm" onClick={onGenerate} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-500">
            {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Zap className="mr-1 h-3 w-3" />}
            Generer les missions
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDeactivate}
            disabled={isDeactivating}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            {isDeactivating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="mr-1 h-3 w-3" />}
            Desactiver
          </Button>
        </div>
      )}
    </div>
  );
}
