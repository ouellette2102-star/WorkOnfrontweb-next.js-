import { SITE_URL } from "@/lib/site";

/**
 * Organization + WebSite structured data for the homepage.
 *
 * - Organization establishes WorkOn as a brand entity for Google (knowledge
 *   panel eligibility, logo in results).
 * - WebSite's SearchAction enables the sitelinks search box, wiring queries
 *   straight to the /pros search.
 *
 * All URLs derive from SITE_URL so they always match the canonical domain.
 */
export function HomeStructuredData() {
  const graph = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "WorkOn",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      description:
        "Marketplace qui connecte clients et professionnels vérifiés au Québec. Réservation en 1 tap, paiement sécurisé par Stripe.",
      areaServed: { "@type": "AdministrativeArea", name: "Québec, Canada" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "WorkOn",
      url: SITE_URL,
      inLanguage: "fr-CA",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/pros?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
