"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

/**
 * Client filter bar for the /missions feed. Mutates the URL
 * search params (category, city) and drops `page` so page 1
 * is loaded on every filter change. The server component
 * re-renders with the new params and re-queries the feed.
 */
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

  // Keep drafts in sync if the user navigates via pagination buttons.
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
    router.replace("/missions");
  };

  const hasAnyFilter = !!categoryDraft || !!cityDraft.trim();

  return (
    <form
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-workon-border bg-white p-2"
      onSubmit={(e) => {
        e.preventDefault();
        push({});
      }}
      data-testid="missions-filter-bar"
    >
      <select
        value={categoryDraft}
        onChange={(e) => {
          setCategoryDraft(e.target.value);
          push({ category: e.target.value });
        }}
        className="min-w-[140px] rounded-full border border-workon-border bg-white px-3 py-1.5 text-sm text-workon-ink focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary-ring"
        data-testid="filter-category"
      >
        <option value="">Toutes catégories</option>
        {categoryOptions.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="flex flex-1 items-center gap-2 rounded-full border border-workon-border bg-white px-3 py-1.5 focus-within:border-workon-primary focus-within:ring-1 focus-within:ring-workon-primary-ring">
        <Search className="h-3.5 w-3.5 text-workon-muted" />
        <input
          type="text"
          placeholder="Ville (ex. Montréal)"
          value={cityDraft}
          onChange={(e) => setCityDraft(e.target.value)}
          className="w-full bg-transparent text-sm text-workon-ink placeholder:text-workon-muted focus:outline-none"
          data-testid="filter-city"
        />
      </label>

      <button
        type="submit"
        className="rounded-full bg-workon-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-workon-primary-hover"
        data-testid="filter-apply"
      >
        Filtrer
      </button>

      {hasAnyFilter && (
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 rounded-full border border-workon-border bg-workon-bg px-3 py-1.5 text-xs font-medium text-workon-muted hover:text-workon-ink"
          data-testid="filter-reset"
        >
          <X className="h-3 w-3" />
          Réinitialiser
        </button>
      )}
    </form>
  );
}
