import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProProfile } from "./pro-profile";

// Disable ISR/SSG for this route. We hit the cache-poisoning trap in
// PR #224: notFound() pinned the 404 page in ISR for hours after the
// backend recovered from schema drift. force-dynamic guarantees a
// fresh fetch on every request, so a backend recovery is reflected
// instantly on /pro/[slug]. Vercel's Edge cache and the upstream
// API's own cache cover the freshness story — ISR was overhead with
// real downside.
//
// SEO is preserved: every request still server-renders the full page
// with metadata; we just don't keep the rendered output around.
export const dynamic = "force-dynamic";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  type: string;
}

interface ProData {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  city: string | null;
  pictureUrl: string | null;
  bio: string | null;
  category: string | null;
  serviceRadiusKm: number | null;
  completionScore: number | null;
  slug: string;
  verified: boolean;
  memberSince: string;
  demandCount: number;
  gallery: GalleryItem[];
}

async function getProBySlug(slug: string): Promise<ProData | null> {
  if (!API_BASE) return null;
  try {
    // Cache successful responses for 60 s (ISR), but never cache the
    // miss path. The previous behavior cached the entire page with a
    // 404 status when the upstream API briefly 500-d (e.g. during a
    // schema drift) — Sentry-recovered fixes then took 5+ minutes to
    // surface in the UI because the cached 404 stayed sticky. Splitting
    // success vs failure paths keeps ISR fast on the happy path while
    // letting the next request after a recovery render fresh data.
    const res = await fetch(`${API_BASE}/pros/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      // Re-fetch with no-store so the framework doesn't pin the
      // failure to the cached entry. The caller will treat null as
      // notFound() but won't poison ISR.
      try {
        const retry = await fetch(`${API_BASE}/pros/${slug}`, {
          cache: "no-store",
        });
        if (!retry.ok) return null;
        return retry.json();
      } catch {
        return null;
      }
    }
    return res.json();
  } catch {
    return null;
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  menage: "Ménage résidentiel",
  paysagement: "Entretien paysager",
  lavage: "Lavage de vitres",
  deneigement: "Déneigement",
  renovation: "Rénovation",
  plomberie: "Plomberie",
  electricite: "Électricité",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pro = await getProBySlug(slug);

  if (!pro) {
    return { title: "Professionnel introuvable — WorkOn" };
  }

  const categoryLabel = pro.category
    ? CATEGORY_LABELS[pro.category] || pro.category
    : "Professionnel";
  const title = `${pro.fullName} — ${categoryLabel} à ${pro.city || "Québec"} | WorkOn`;
  const description = pro.bio
    ? pro.bio.slice(0, 155)
    : `${pro.fullName}, ${categoryLabel} à ${pro.city || "Québec"}. Demandez une soumission gratuite sur WorkOn.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://workon.app/pro/${slug}`,
      images: pro.pictureUrl ? [{ url: pro.pictureUrl }] : [],
      siteName: "WorkOn",
    },
    alternates: {
      canonical: `https://workon.app/pro/${slug}`,
    },
  };
}

export default async function ProPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pro = await getProBySlug(slug);

  if (!pro) notFound();

  const categoryLabel = pro.category
    ? CATEGORY_LABELS[pro.category] || pro.category
    : "Professionnel";

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: pro.fullName,
    description: pro.bio || `${categoryLabel} à ${pro.city || "Québec"}`,
    url: `https://workon.app/pro/${slug}`,
    image: pro.pictureUrl || undefined,
    address: pro.city
      ? {
          "@type": "PostalAddress",
          addressLocality: pro.city,
          addressRegion: "QC",
          addressCountry: "CA",
        }
      : undefined,
    areaServed: pro.serviceRadiusKm
      ? {
          "@type": "GeoCircle",
          geoMidpoint: { "@type": "GeoCoordinates" },
          geoRadius: `${pro.serviceRadiusKm} km`,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProProfile pro={pro} />
    </>
  );
}
