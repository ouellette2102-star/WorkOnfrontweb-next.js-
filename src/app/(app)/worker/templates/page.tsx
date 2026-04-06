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
        category,
        price: parseFloat(price),
        recurrence,
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
        <h1 className="text-2xl font-bold text-white">Modeles recurrents</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-500">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold text-white">Creer un modele</h3>
          <div>
            <label className="mb-1 block text-xs text-white/60">Titre</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Menage hebdomadaire"
              className="border-white/10 bg-white/5 text-white placeholder-white/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Decrivez la mission..."
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/60">Categorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-red-500 focus:outline-none"
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
              <label className="mb-1 block text-xs text-white/60">Prix ($)</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="50.00"
                className="border-white/10 bg-white/5 text-white placeholder-white/30"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Recurrence</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-red-500 focus:outline-none"
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
              className="bg-red-600 hover:bg-red-500"
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
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <RefreshCw className="mx-auto mb-4 h-12 w-12 text-white/30" />
          <h3 className="mb-2 text-lg font-semibold text-white">Aucun modele</h3>
          <p className="text-white/60">
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
    <div className={`rounded-xl border p-4 ${template.isActive ? "border-white/10 bg-neutral-900/80" : "border-white/5 bg-neutral-950/50 opacity-60"}`}>
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white">{template.title}</h3>
          <p className="text-sm text-white/50">{template.description}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs ${template.isActive ? "bg-green-500/20 text-green-400" : "bg-neutral-500/20 text-neutral-400"}`}>
          {template.isActive ? "Actif" : "Inactif"}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-white/10 px-2 py-1 text-white/70">{template.category}</span>
        <span className="rounded-full bg-white/10 px-2 py-1 text-white/70">{template.price.toFixed(2)} $</span>
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
