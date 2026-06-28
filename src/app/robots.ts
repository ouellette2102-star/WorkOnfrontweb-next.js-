import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Dynamic robots.txt — single source of truth.
 *
 * Replaces two conflicting static files (src/app/robots.txt pointed its
 * Sitemap at the never-owned workon.app domain; public/robots.txt carried a
 * different rule set). Both the rules and the sitemap URL now derive from
 * SITE_URL so the crawl directives always match the live canonical domain.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/dashboard/",
        "/debug/",
        "/worker/",
        "/employer/",
        "/onboarding/",
        "/profile/",
        "/sign-in",
        "/sign-up",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
