"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  other: "Autres services",
  cleaning: "Ménage",
  menage: "Ménage",
  reparation: "Réparation",
  entretien: "Entretien",
  snow_removal: "Déneigement",
  paysagement: "Paysagement",
  construction: "Construction",
  "construction-legere": "Construction légère",
  plomberie: "Plomberie",
  electrical: "Électricité",
  electricite: "Électricité",
};

function formatCategoryLabel(value: string) {
  if (!value) return "Toutes catégories";
  if (CATEGORY_LABELS[value]) return CATEGORY_LABELS[value];

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function MissionsFilterBar({
  category,
  city,
  categoryOptions,
}: {
  category: string;
  city: string;
  categoryOptions: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [cityDraft, setCityDraft] = useState(city);
  const [categoryDraft, setCategoryDraft] = useState(category);
  const [categoryOpen, setCategoryOpen] = useState(false);

  useEffect(() => {
    setCityDraft(city);
  }, [city]);

  useEffect(() => {
    setCategoryDraft(category);
  }, [category]);

  const push = (next: { category?: string; city?: string }) => {
    const sp = new URLSearchParams(params.toString());
    sp.delete("page");
    const nextCategory = next.category ?? categoryDraft;
    const nextCity = next.city ?? cityDraft;

    if (nextCategory) sp.set("category", nextCategory);
    else sp.delete("category");

    if (nextCity.trim()) sp.set("city", nextCity.trim());
    else sp.delete("city");

    const qs = sp.toString();
    router.replace(qs ? `/missions?${qs}` : "/missions");
  };

  const reset = () => {
    setCategoryDraft("");
    setCityDraft("");
    setCategoryOpen(false);
    router.replace("/missions");
  };

  const hasAnyFilter = !!categoryDraft || !!cityDraft.trim();

  return (
    <form
      className="rounded-[22px] border border-workon-border bg-white p-3 shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        push({});
      }}
      data-testid="missions-filter-bar"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-workon-stone">
          <SlidersHorizontal className="h-3.5 w-3.5 text-workon-copper" />
          Filtres
        </p>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-full bg-workon-bg px-2.5 py-1 text-xs font-bold text-workon-muted hover:text-workon-ink"
            data-testid="filter-reset"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(160px,220px)_1fr_auto]">
        <div
          className="relative"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setCategoryOpen(false);
            }
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-workon-muted" />
          <button
            type="button"
            onClick={() => setCategoryOpen((open) => !open)}
            className="flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-workon-border bg-workon-bg pl-9 pr-3 text-left text-sm font-semibold text-workon-ink outline-none transition hover:border-workon-primary/40 focus:border-workon-primary focus:ring-2 focus:ring-workon-primary-ring"
            data-testid="filter-category"
            aria-haspopup="listbox"
            aria-expanded={categoryOpen}
          >
            <span className="truncate">
              {formatCategoryLabel(categoryDraft)}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-workon-muted transition-transform",
                categoryOpen && "rotate-180",
              )}
            />
          </button>

          {categoryOpen && (
            <div
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-72 overflow-y-auto rounded-2xl border border-workon-border bg-white p-1.5 shadow-[0_18px_48px_rgba(27,26,24,0.16)]"
            >
              {["", ...categoryOptions].map((option) => {
                const active = categoryDraft === option;
                return (
                  <button
                    key={option || "all"}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setCategoryDraft(option);
                      setCategoryOpen(false);
                      push({ category: option });
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                      active
                        ? "bg-workon-primary text-white"
                        : "text-workon-ink hover:bg-workon-bg",
                    )}
                  >
                    <span className="truncate">
                      {formatCategoryLabel(option)}
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <label className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-workon-copper" />
          <input
            type="text"
            placeholder="Ville ou secteur"
            value={cityDraft}
            onChange={(event) => setCityDraft(event.target.value)}
            className="h-11 w-full rounded-2xl border border-workon-border bg-workon-bg pl-9 pr-3 text-sm font-semibold text-workon-ink outline-none transition placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary-ring"
            data-testid="filter-city"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-workon-primary px-4 text-sm font-bold text-white shadow-md shadow-workon-primary/20 transition hover:bg-workon-primary-hover"
          data-testid="filter-apply"
        >
          Appliquer
        </button>
      </div>
    </form>
  );
}
