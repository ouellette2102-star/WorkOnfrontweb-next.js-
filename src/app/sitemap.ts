import type { MetadataRoute } from "next";
import { getFeaturedWorkers } from "@/lib/public-api";

/**
 * Dynamic sitemap.
 *
 * Static marketing pages are hard-coded with sensible changeFrequency
 * + priority values. Public worker profiles (/p/{slug}) are fetched
 * from the backend public API and appended. If the backend is
 * unreachable, we degrade gracefully to the static list — never fail
 * the route.
 *
 * Revalidated every 10 minutes to keep SEO fresh without hammering
 * the backend.
 */

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://workonapp.vercel.app";

  const now = new Date();

  // ── Static marketing / product pages ────────────────────────────────
  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl,                    changeFrequency: "daily",   priority: 1.0, lastModified: now },
    { url: `${baseUrl}/pros`,          changeFrequency: "hourly",  priority: 0.9, lastModified: now },
    { url: `${baseUrl}/employeurs`,    changeFrequency: "daily",   priority: 0.9, lastModified: now },
    { url: `${baseUrl}/missions`,      changeFrequency: "hourly",  priority: 0.9, lastModified: now },
    { url: `${baseUrl}/map`,           changeFrequency: "hourly",  priority: 0.8, lastModified: now },
    { url: `${baseUrl}/pricing`,       changeFrequency: "weekly",  priority: 0.7, lastModified: now },
    { url: `${baseUrl}/faq`,           changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: `${baseUrl}/legal/privacy`, changeFrequency: "yearly",  priority: 0.3, lastModified: now },
    { url: `${baseUrl}/legal/terms`,   changeFrequency: "yearly",  priority: 0.3, lastModified: now },
  ];

  // ── Dynamic public worker profiles ──────────────────────────────────
  let workerEntries: MetadataRoute.Sitemap = [];
  try {
    const workers = await getFeaturedWorkers(50);
    workerEntries = workers.map((w) => ({
      url: `${baseUrl}/p/${w.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      lastModified: now,
    }));
  } catch (err) {
    // Non-fatal: degrade to the static list if the backend is down.
    console.warn("[sitemap] failed to fetch featured workers", err);
  }

  return [...staticEntries, ...workerEntries];
}
