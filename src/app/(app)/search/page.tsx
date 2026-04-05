"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { WorkerCard } from "@/components/worker/worker-card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2 } from "lucide-react";

export default function SearchPage() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  const { data: workersData, isLoading } = useQuery({
    queryKey: ["workers", city, category],
    queryFn: () =>
      api.getWorkers({
        city: city || undefined,
        category: category || undefined,
        limit: 20,
      }),
  });

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold">Trouvez votre talent</h1>

      {/* Search bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          placeholder="Rechercher par ville..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category filter chips */}
      {categories && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setCategory("")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !category
                ? "bg-red-600 text-white"
                : "bg-neutral-800 text-white/60 hover:bg-neutral-700"
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.name === category ? "" : cat.name)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat.name
                  ? "bg-red-600 text-white"
                  : "bg-neutral-800 text-white/60 hover:bg-neutral-700"
              }`}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-red-accent" />
        </div>
      ) : workersData && workersData.workers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workersData.workers.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-white/50">
          <p>Aucun professionnel trouvé</p>
          <p className="text-sm mt-1">Essayez une autre ville ou catégorie</p>
        </div>
      )}
    </div>
  );
}
