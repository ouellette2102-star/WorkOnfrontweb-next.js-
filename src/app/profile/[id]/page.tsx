/**
 * Page de profil public d'un worker (vitrine partageable)
 * PR-25: Profil public & vitrine partageable
 *
 * - URL publique stable: /profile/[id]
 * - Accessible sans connexion
 * - Vitrine: services, réputation, bio
 * - CTA conformes anti-bypass
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ProfileHeader } from "@/components/profile-header";
import { PortfolioPost } from "@/components/portfolio-post";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageCircle, Briefcase, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import type {
  UserWithFullProfile,
  PortfolioItem,
  WorkerSkill,
  Review,
} from "@/types/profile";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

// Max reviews to show on profile
const MAX_REVIEWS_DISPLAYED = 3;

/**
 * Fetch public profile from backend
 */
async function getPublicProfile(
  userId: string
): Promise<UserWithFullProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error(
        `[PROFILE_FETCH] Backend error: ${response.status}`,
        await response.text().catch(() => "")
      );
      return null;
    }

    const data = await response.json();
    return data.user ?? data;
  } catch (error) {
    console.error("[PROFILE_FETCH] Error:", error);
    return null;
  }
}

/**
 * Calculate average rating from reviews
 */
function calculateAverageRating(reviews: Review[]): number {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}

/**
 * Format "member since" date
 */
function formatMemberSince(dateString: string): string {
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("fr-CA", options);
  } catch {
    return "";
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;

  const user = await getPublicProfile(id);

  // Profile not found
  if (!user) {
    notFound();
  }

  const workerProfile = user.workerProfile;
  const userProfile = user.profile;
  const reviews = user.reviewsReceived ?? [];

  // Calculate real average rating
  const averageRating = calculateAverageRating(reviews);
  const reviewCount = reviews.length;

  // Get recent reviews (max 3)
  const recentReviews = reviews
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_REVIEWS_DISPLAYED);

  const hasMoreReviews = reviews.length > MAX_REVIEWS_DISPLAYED;

  // Portfolio items
  const portfolio: PortfolioItem[] = workerProfile?.portfolio ?? [];

  // Skills
  const skills: WorkerSkill[] = workerProfile?.skills ?? [];

  // Member since
  const memberSince = formatMemberSince(user.createdAt);

  // Completed missions
  const completedMissions = workerProfile?.completedMissions ?? 0;

  // Bio (use profile bio, fallback to city)
  const bio = userProfile?.bio ?? (userProfile?.city ? `Basé à ${userProfile.city}` : null);

  // Hourly rate
  const hourlyRate = workerProfile?.hourlyRate ?? 0;

  return (
    <div className="min-h-screen bg-workon-bg text-workon-ink">
      {/* Sticky Header */}
      <ProfileHeader
        user={{
          id: user.id,
          name: userProfile?.name ?? "Travailleur WorkOn",
          avatarUrl: null,
          rating: averageRating,
          ratingCount: reviewCount,
          level: Math.min(5, Math.floor(completedMissions / 5) + 1),
          badges: skills.filter((s) => s.verified).length > 0 ? ["Vérifié"] : [],
          completedMissions,
          bio,
        }}
      />

      {/* Main Content */}
      <div className="pt-32 pb-28">
        <div className="max-w-2xl mx-auto px-4 space-y-4">

          {/* Quick Stats */}
          <Card className="border-workon-border bg-workon-bg0">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                    <Star className="h-5 w-5 fill-yellow-500" />
                    <span className="text-xl font-bold">
                      {averageRating > 0 ? averageRating.toFixed(1) : "-"}
                    </span>
                  </div>
                  <p className="text-xs text-workon-muted">
                    {reviewCount} avis
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-xl font-bold">{completedMissions}</span>
                  </div>
                  <p className="text-xs text-workon-muted">missions</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-workon-muted">
                    {memberSince ? `Depuis ${memberSince}` : "Nouveau membre"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location (if available) */}
          {userProfile?.city && (
            <div className="flex items-center gap-2 text-workon-muted text-sm px-1">
              <MapPin className="h-4 w-4" />
              <span>{userProfile.city}</span>
            </div>
          )}

          {/* Portfolio */}
          {portfolio.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold px-1">Portfolio</h2>
              {portfolio.map((item: PortfolioItem, index: number) => (
                <PortfolioPost
                  key={index}
                  post={{
                    url: item.url,
                    type: item.type,
                    caption: item.caption,
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="border-workon-border bg-white/30">
              <CardContent className="p-6 text-center">
                <p className="text-workon-muted text-sm">Pas de portfolio pour le moment</p>
              </CardContent>
            </Card>
          )}

          {/* Services & Rates */}
          <Card className="border-workon-border bg-workon-bg0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Services</h2>
                {hourlyRate > 0 && (
                  <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                    À partir de ${hourlyRate.toFixed(0)}/h
                  </Badge>
                )}
              </div>

              {skills.length > 0 ? (
                <div className="space-y-2">
                  {skills.map((ws: WorkerSkill) => (
                    <div
                      key={ws.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{ws.skill.name}</p>
                        <p className="text-xs text-workon-muted">
                          {ws.skill.category.name}
                        </p>
                      </div>
                      {ws.verified && (
                        <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-workon-muted text-sm text-center py-4">
                  Services non renseignés
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card className="border-workon-border bg-workon-bg0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Avis clients</h2>
                {reviewCount > 0 && (
                  <div className="flex items-center gap-1 text-sm text-workon-muted">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span>{averageRating.toFixed(1)}</span>
                    <span className="text-workon-muted">({reviewCount})</span>
                  </div>
                )}
              </div>

              {recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {recentReviews.map((review: Review) => (
                    <div key={review.id} className="border-b border-workon-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {review.author.profile?.name ?? "Client"}
                            </span>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? "fill-yellow-500 text-yellow-500"
                                      : "text-white/20"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-workon-muted">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {hasMoreReviews && (
                    <p className="text-center text-sm text-workon-muted pt-2">
                      + {reviews.length - MAX_REVIEWS_DISPLAYED} autres avis
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-workon-muted text-sm text-center py-4">
                  Aucun avis pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Bar (Fixed Bottom) - Conforme anti-bypass */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-workon-border bg-workon-bg/95 ">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-3">
            {/* CTA principal: Créer une mission pour ce worker */}
            <Link href="/missions/new" className="flex-1">
              <Button className="w-full bg-red-600 hover:bg-red-500">
                <Briefcase className="h-4 w-4 mr-2" />
                Proposer une mission
              </Button>
            </Link>
            {/* CTA secondaire: Voir les missions disponibles du worker (disabled si non connecté) */}
            <Button variant="outline" size="icon" disabled title="Contacter (connexion requise)">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-center text-xs text-workon-muted mt-2">
            Créez une mission pour contacter ce travailleur
          </p>
        </div>
      </div>
    </div>
  );
}
