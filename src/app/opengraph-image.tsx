import { ImageResponse } from "next/og";

// Root Open Graph image for the landing page.
// Next.js App Router convention: this file name creates /opengraph-image
// and is automatically wired into the page metadata as og:image.

export const runtime = "edge";
export const alt = "WorkOn — Une ligne directe vers le travail instantané";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top: wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#134021",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "32px",
              fontWeight: 900,
            }}
          >
            W
          </div>
          <div
            style={{
              color: "white",
              fontSize: "40px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            WorkOn
          </div>
        </div>

        {/* Middle: tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: "72px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: "1000px",
            }}
          >
            Une ligne directe vers le{" "}
            <span style={{ color: "#B5382A" }}>travail instantané</span>.
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "28px",
              fontWeight: 500,
              lineHeight: 1.3,
              maxWidth: "900px",
            }}
          >
            Missions payées rapidement. Travailleurs vérifiés. Paiement sécurisé.
          </div>
        </div>

        {/* Bottom: trust pills */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          {[
            { label: "⚡ 0% commission", bg: "rgba(255,77,28,0.15)", fg: "#FF8C5A", border: "rgba(255,77,28,0.4)" },
            { label: "🔒 Escrow Stripe", bg: "rgba(34,197,94,0.15)", fg: "#4ADE80", border: "rgba(34,197,94,0.4)" },
            { label: "📍 Québec", bg: "rgba(255,255,255,0.08)", fg: "rgba(255,255,255,0.8)", border: "rgba(255,255,255,0.2)" },
          ].map((pill) => (
            <div
              key={pill.label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 24px",
                borderRadius: "999px",
                background: pill.bg,
                color: pill.fg,
                fontSize: "24px",
                fontWeight: 600,
                border: `2px solid ${pill.border}`,
              }}
            >
              {pill.label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
