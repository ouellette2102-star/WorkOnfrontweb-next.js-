import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/navigation/user-nav";
import { getWorkerBySlug, getFeaturedReviews, type PublicWorkerProfile, type FeaturedReview } from "@/lib/public-api";

// SSR — always fresh (public profile, SEO + real-time ratings)
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const worker = await getWorkerBySlug(slug);
    if (!worker) return { title: "Profil introuvable — WorkOn" };
    return {
      title: `${worker.firstName} ${worker.lastName[0]}. — Travailleur sur WorkOn`,
      description: worker.bio ?? `Profil de ${worker.firstName} sur WorkOn. ${worker.completedMissions} missions complétées.`,
    };
  } catch {
    return { title: "WorkOn" };
  }
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-900/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[#FF4D1C] flex items-center justify-center">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <span className="font-bold tracking-tight">WorkOn</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <Link href="/pros" className="hover:text-white transition-colors">Travailleurs</Link>
          <Link href="/missions" className="hover:text-white transition-colors">Missions</Link>
        </nav>
        <UserNav />
      </div>
    </header>
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-lg ${
              i < Math.floor(rating)
                ? "text-yellow-400"
                : i < rating
                ? "text-yellow-400/50"
                : "text-white/20"
            }`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="text-white/50 text-sm">({count} avis)</span>
    </div>
  );
}

function ReviewCard({ r }: { r: FeaturedReview }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < r.rating ? "text-yellow-400 text-sm" : "text-white/20 text-sm"}>★</span>
          ))}
        </div>
        <span className="text-xs text-white/40">
          {new Date(r.createdAt).toLocaleDateString("fr-CA", { month: "short", year: "numeric" })}
        </span>
      </div>
      <p className="text-sm text-white/80 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
      {r.authorName && (
        <p className="mt-2 text-xs text-white/40">{r.authorName}</p>
      )}
    </div>
  );
}

export default async function WorkerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [workerRes, reviewsRes] = await Promise.allSettled([
    getWorkerBySlug(slug),
    getFeaturedReviews(6),
  ]);

  const worker: PublicWorkerProfile | null =
    workerRes.status === "fulfilled" ? workerRes.value : null;
  const featuredReviews: FeaturedReview[] =
    reviewsRes.status === "fulfilled" ? reviewsRes.value : [];

  if (!worker) {
    notFound();
  }

  // JSON-LD Person structured data — helps search engines understand
  // the profile (name, job, location, rating) and surface it in rich
  // results. Uses the last-name initial to match our privacy-preserving
  // display (we never leak the full last name to unauthenticated users).
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://workonapp.vercel.app";
  const personJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `${worker.firstName} ${worker.lastName[0]}.`,
    url: `${siteUrl}/p/${slug}`,
    ...(worker.photoUrl ? { image: worker.photoUrl } : {}),
    ...(worker.bio ? { description: worker.bio } : {}),
    ...(worker.sectors.length > 0
      ? { jobTitle: worker.sectors[0], knowsAbout: worker.sectors }
      : {}),
    ...(worker.city
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: worker.city,
            addressCountry: "CA",
          },
        }
      : {}),
    ...(worker.ratingAvg > 0 && worker.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: worker.ratingAvg.toFixed(1),
            reviewCount: worker.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const initials = `${worker.firstName[0]}${worker.lastName[0]}`.toUpperCase();
  const isVerified =
    worker.trustTier === "VERIFIED" ||
    worker.trustTier === "TRUSTED" ||
    worker.trustTier === "PREMIUM";

  // Use worker's own reviews if available, otherwise show platform featured reviews
  const displayReviews =
    worker.reviews.length > 0 ? worker.reviews : featuredReviews.slice(0, 3);

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      {/* JSON-LD Person structured data for SEO / rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <Header />

      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Profile header */}
        <div className="flex flex-col md:flex-row items-start gap-6 pb-8 border-b border-white/10">
          <div className="relative flex-shrink-0">
            {worker.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={worker.photoUrl}
                alt={worker.firstName}
                className="h-24 w-24 rounded-2xl object-cover border border-white/10"
              />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-[#FF4D1C]/20 border border-[#FF4D1C]/30 flex items-center justify-center">
                <span className="text-2xl font-black text-[#FF4D1C]">{initials}</span>
              </div>
            )}
            {isVerified && (
              <span className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-[#FF4D1C] border-2 border-neutral-900 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="text-2xl font-bold">
                  {worker.firstName} {worker.lastName[0]}.
                </h1>
                {worker.city && (
                  <p className="text-white/50 text-sm mt-0.5">📍 {worker.city}</p>
                )}
              </div>
              {isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF4D1C]/15 text-[#FF4D1C] border border-[#FF4D1C]/25">
                  ✓ Vérifié
                </span>
              )}
            </div>

            {worker.ratingAvg > 0 && (
              <div className="mt-3">
                <StarRating rating={worker.ratingAvg} count={worker.ratingCount} />
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/60">
              <span>
                <span className="font-semibold text-white">{worker.completedMissions}</span> mission{worker.completedMissions !== 1 ? "s" : ""} complétée{worker.completedMissions !== 1 ? "s" : ""}
              </span>
              <span>
                Membre depuis{" "}
                {new Date(worker.memberSince).toLocaleDateString("fr-CA", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {worker.badges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {worker.badges.map((b) => (
                  <span
                    key={b.type}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF4D1C]/15 text-[#FF4D1C] border border-[#FF4D1C]/25"
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <Button className="bg-[#FF4D1C] hover:bg-[#E8441A] text-white" asChild>
              <Link href="/register?role=employer">Engager ce pro</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            {/* Bio */}
            {worker.bio && (
              <section>
                <h2 className="text-lg font-bold mb-3">À propos</h2>
                <p className="text-white/70 leading-relaxed text-sm">{worker.bio}</p>
              </section>
            )}

            {/* Sectors */}
            {worker.sectors.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-3">Secteurs d&apos;expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {worker.sectors.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white/70"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            {displayReviews.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4">
                  Avis {worker.reviews.length === 0 ? "de la plateforme" : "clients"}
                </h2>
                <div className="space-y-3">
                  {displayReviews.map((r) => (
                    <ReviewCard key={r.id} r={r} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Stats card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h3 className="font-bold text-sm text-white/70 uppercase tracking-wide">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Missions</span>
                  <span className="font-bold">{worker.completedMissions}</span>
                </div>
                {worker.ratingAvg > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Note moyenne</span>
                    <span className="font-bold text-yellow-400">{worker.ratingAvg.toFixed(1)} ★</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Secteurs</span>
                  <span className="font-bold">{worker.sectors.length || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Statut</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isVerified ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-white/10 text-white/50"}`}>
                    {isVerified ? "Vérifié" : "Nouveau"}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-3xl border border-[#FF4D1C]/25 bg-[#FF4D1C]/10 p-5">
              <h3 className="font-bold mb-1">Besoin de ce pro ?</h3>
              <p className="text-xs text-white/60 mb-4 leading-relaxed">
                Publiez votre mission et entrez en contact directement.
              </p>
              <Button className="w-full bg-[#FF4D1C] hover:bg-[#E8441A] text-white" asChild>
                <Link href="/register?role=employer">Publier une mission</Link>
              </Button>
              <p className="text-xs text-white/40 text-center mt-2">Gratuit pendant le lancement</p>
            </div>

            {/* Back to list */}
            <Link
              href="/pros"
              className="block text-center text-sm text-white/50 hover:text-white/80 transition-colors py-2"
            >
              ← Voir tous les travailleurs
            </Link>
          </aside>
        </div>
      </div>

      <footer className="border-t border-white/10 mt-10">
        <div className="mx-auto max-w-4xl px-4 py-6 flex items-center justify-between text-xs text-white/40">
          <Link href="/" className="hover:text-white/70">WorkOn</Link>
          <p>Les travailleurs sont des prestataires autonomes.</p>
        </div>
      </footer>
    </main>
  );
}
