import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProProfile } from "./pro-profile";

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
    const res = await fetch(`${API_BASE}/api/v1/pros/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
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
