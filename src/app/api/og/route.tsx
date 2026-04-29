import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

/**
 * Dynamic Open Graph image generator for WorkOn pro cards.
 *
 * QA report C6 / Sprint 2: the Buffer/social-distribution pipeline
 * targets `/api/og?name=...&category=...&city=...` for each worker
 * so a card can circulate on Facebook / Instagram / LinkedIn /
 * Twitter previews. The Next.js App Router convention generates a
 * static `/opengraph-image` for the landing page (kept in
 * `src/app/opengraph-image.tsx`), but Buffer needs **dynamic params**
 * — hence this route.
 *
 * Query params:
 *   - name      Worker first name + last initial (e.g. "Marc D.")
 *   - category  Service category (e.g. "Paysagement")
 *   - city      Worker city (e.g. "Repentigny")
 *   - photo     Optional avatar URL (must be public, https)
 *   - tier      Optional Trust Tier (BASIC | VERIFIED | TRUSTED | PREMIUM)
 *   - rating    Optional 0-5 average rating
 *   - missions  Optional completed mission count
 *
 * If params are missing the route falls back to the generic landing
 * card so a typo never breaks SEO. Returned image is 1200x630 PNG,
 * suitable for og:image, twitter:card, and most social previews.
 *
 * Edge runtime so the response is cached at the CDN edge and we
 * don't pay a cold-start on every share.
 */

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 } as const;

const ACCENT_RED = "#FF4D1C";
const INK = "#0F0F0F";
const NIGHT = "#0A1828";
const NIGHT_2 = "#11253E";
const CREAM = "#F5EFE6";

interface CardParams {
  name?: string;
  category?: string;
  city?: string;
  photo?: string;
  tier?: string;
  rating?: string;
  missions?: string;
}

function tierBadge(tier?: string): { label: string; bg: string } | null {
  switch ((tier || "").toUpperCase()) {
    case "PREMIUM":
      return { label: "★ Premium", bg: "#D4922A" };
    case "TRUSTED":
      return { label: "✓ De confiance", bg: "#22C55E" };
    case "VERIFIED":
      return { label: "✓ Vérifié", bg: "#2563EB" };
    case "BASIC":
      return { label: "Nouveau", bg: "#706E6A" };
    default:
      return null;
  }
}

function clampRating(raw?: string): string | null {
  if (!raw) return null;
  const r = Number(raw);
  if (Number.isNaN(r) || r <= 0) return null;
  // Show one decimal max
  return r.toFixed(1).replace(/\.0$/, "");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params: CardParams = {
    name: searchParams.get("name") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    photo: searchParams.get("photo") ?? undefined,
    tier: searchParams.get("tier") ?? undefined,
    rating: searchParams.get("rating") ?? undefined,
    missions: searchParams.get("missions") ?? undefined,
  };

  const hasName = Boolean(params.name && params.name.trim());
  const tier = tierBadge(params.tier);
  const rating = clampRating(params.rating);
  const missionsCount = params.missions ? Number(params.missions) : null;

  // Generic fallback when no name is provided — same gradient as the
  // landing card but without a specific worker.
  if (!hasName) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: `linear-gradient(135deg, ${NIGHT} 0%, ${NIGHT_2} 50%, ${NIGHT} 100%)`,
            padding: "80px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: "40px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Work<span style={{ color: ACCENT_RED }}>•</span>n
          </div>
          <div
            style={{
              color: "white",
              fontSize: "72px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Une ligne directe vers le{" "}
            <span style={{ color: ACCENT_RED }}>travail instantané</span>.
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "26px",
              fontWeight: 500,
            }}
          >
            workon.ca
          </div>
        </div>
      ),
      { ...SIZE },
    );
  }

  // Worker card — name + category + city, optional photo + trust badges.
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: CREAM,
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Left column: photo or initials */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "440px",
            marginRight: "60px",
          }}
        >
          {params.photo ? (
            // Edge runtime can't fetch arbitrary URLs without satori-friendly
            // support, but ImageResponse passes the URL through to a real
            // <img> render. If the photo fails to load the surrounding flex
            // box still renders cleanly.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={params.photo}
              width={400}
              height={400}
              alt={params.name}
              style={{
                width: "400px",
                height: "400px",
                borderRadius: "32px",
                objectFit: "cover",
                border: `8px solid ${ACCENT_RED}`,
              }}
            />
          ) : (
            <div
              style={{
                width: "400px",
                height: "400px",
                borderRadius: "32px",
                background: ACCENT_RED,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "180px",
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              {params.name!.trim()[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Right column: name, category, city, badges */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          {/* Brand mark — small and unobtrusive */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: INK,
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Work<span style={{ color: ACCENT_RED }}>•</span>n
          </div>

          {/* Worker name + headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                color: INK,
                fontSize: "76px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.0,
              }}
            >
              {params.name}
            </div>
            {params.category && (
              <div
                style={{
                  color: ACCENT_RED,
                  fontSize: "44px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  textTransform: "capitalize",
                }}
              >
                {params.category}
              </div>
            )}
            {params.city && (
              <div
                style={{
                  color: "#706E6A",
                  fontSize: "32px",
                  fontWeight: 500,
                }}
              >
                📍 {params.city}
              </div>
            )}
          </div>

          {/* Stats row */}
          {(rating || missionsCount !== null || tier) && (
            <div
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {tier && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 22px",
                    borderRadius: "999px",
                    background: tier.bg,
                    color: "white",
                    fontSize: "22px",
                    fontWeight: 700,
                  }}
                >
                  {tier.label}
                </div>
              )}
              {rating && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 22px",
                    borderRadius: "999px",
                    background: "#FFF",
                    color: INK,
                    fontSize: "22px",
                    fontWeight: 700,
                    border: "2px solid #EAE6DF",
                  }}
                >
                  ★ {rating}
                </div>
              )}
              {missionsCount !== null && missionsCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 22px",
                    borderRadius: "999px",
                    background: "#FFF",
                    color: INK,
                    fontSize: "22px",
                    fontWeight: 700,
                    border: "2px solid #EAE6DF",
                  }}
                >
                  {missionsCount} mission{missionsCount > 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#706E6A",
              fontSize: "22px",
              fontWeight: 500,
            }}
          >
            <div>Réserver sur workon.ca</div>
            <div style={{ color: ACCENT_RED, fontWeight: 700 }}>
              ⚡ Pro vérifié WorkOn
            </div>
          </div>
        </div>
      </div>
    ),
    { ...SIZE },
  );
}
