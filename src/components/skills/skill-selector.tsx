"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Check, X, Search, Loader2 } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  nameEn?: string | null;
  categoryId?: string;
  category?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  nameEn?: string | null;
  icon?: string | null;
}

export function SkillSelector() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  // Fetch categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  // Fetch skills filtered by category
  const { data: skillsData, isLoading: loadingSkills } = useQuery({
    queryKey: ["catalog-skills", selectedCategory, searchQuery],
    queryFn: () =>
      api.getSkills({
        categoryName: selectedCategory || undefined,
        q: searchQuery || undefined,
      }),
  });

  const skills: Skill[] = skillsData?.data ?? [];

  // Fetch worker's current skills
  const { data: mySkills, isLoading: loadingMySkills } = useQuery({
    queryKey: ["my-skills"],
    queryFn: () => api.getMySkills(),
    retry: false,
  });

  // Initialize selected IDs from worker's saved skills
  useEffect(() => {
    if (mySkills && Array.isArray(mySkills) && !dirty) {
      setSelectedIds(new Set(mySkills.map((s: any) => s.id ?? s.skillId ?? s)));
    }
  }, [mySkills, dirty]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (ids: string[]) => api.setMySkills(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-skills"] });
      setDirty(false);
      toast.success("Competences sauvegardees");
    },
    onError: () => {
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  // Selected skills details for tags display
  const selectedSkills = useMemo(() => {
    if (!skills.length && !mySkills?.length) return [];
    // Merge from current skills list + saved skills for display
    const allKnown = new Map<string, Skill>();
    for (const s of skills) allKnown.set(s.id, s);
    if (mySkills) {
      for (const s of mySkills) {
        const id = s.id ?? s.skillId ?? s;
        if (!allKnown.has(id)) {
          allKnown.set(id, { id, name: s.name ?? id });
        }
      }
    }
    return Array.from(selectedIds)
      .map((id) => allKnown.get(id))
      .filter(Boolean) as Skill[];
  }, [selectedIds, skills, mySkills]);

  const toggleSkill = (skillId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
    setDirty(true);
  };

  const removeSkill = (skillId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(skillId);
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    saveMutation.mutate(Array.from(selectedIds));
  };

  const isLoading = loadingCategories || loadingMySkills;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Selected skills tags */}
      {selectedSkills.length > 0 && (
        <div>
          <label className="text-sm text-workon-muted">
            Competences selectionnees ({selectedSkills.length})
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-workon-primary/20 bg-workon-primary/10 px-3 py-1.5 text-sm font-medium text-workon-primary"
              >
                {skill.name}
                <button
                  type="button"
                  onClick={() => removeSkill(skill.id)}
                  className="rounded-full p-0.5 transition hover:bg-workon-primary/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-workon-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une competence..."
          className="w-full rounded-2xl border border-workon-border bg-workon-bg py-3 pl-10 pr-4 text-workon-ink placeholder-workon-muted/50 focus:border-workon-primary focus:outline-none"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
            selectedCategory === null
              ? "bg-workon-primary text-white shadow-sm"
              : "border border-workon-border bg-white text-workon-muted hover:border-workon-primary/40 hover:text-workon-primary"
          }`}
        >
          Toutes
        </button>
        {(categories as Category[]).map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.name)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
              selectedCategory === cat.name
                ? "bg-workon-primary text-white shadow-sm"
                : "border border-workon-border bg-white text-workon-muted hover:border-workon-primary/40 hover:text-workon-primary"
            }`}
          >
            {cat.icon ? `${cat.icon} ` : ""}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Skills grid */}
      <div className="min-h-[120px]">
        {loadingSkills ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-workon-muted" />
          </div>
        ) : skills.length === 0 ? (
          <p className="py-6 text-center text-sm text-workon-muted">
            Aucune competence trouvee.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {skills.map((skill) => {
              const isSelected = selectedIds.has(skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "border-workon-primary bg-workon-primary/10 text-workon-primary font-medium"
                      : "border-workon-border bg-white text-workon-ink hover:border-workon-primary/40"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                      isSelected
                        ? "border-workon-primary bg-workon-primary text-white"
                        : "border-workon-border bg-workon-bg"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="truncate">{skill.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || saveMutation.isPending}
        className="w-full rounded-2xl bg-workon-primary px-6 py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-workon-primary-hover disabled:opacity-70 shadow-md shadow-workon-primary/25"
      >
        {saveMutation.isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Enregistrement...
          </span>
        ) : (
          `Sauvegarder les competences (${selectedIds.size})`
        )}
      </button>
    </div>
  );
}
