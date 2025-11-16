import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProfileHeader } from "@/components/profile-header";
import { PortfolioPost } from "@/components/portfolio-post";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, Heart } from "lucide-react";

interface ProfilePageProps {
  params: { id: string };
}

const userWithProfile = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    profile: true,
    workerProfile: {
      include: {
        skills: {
          include: {
            skill: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    },
    reviewsReceived: {
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    },
  },
});

type UserWithProfile = Prisma.UserGetPayload<typeof userWithProfile>;

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = params;

  const user = await prisma.user.findUnique({
    where: { id },
    ...userWithProfile,
  });

  if (!user || !user.workerProfile) {
    notFound();
  }

  const workerProfile = user.workerProfile;

  const portfolio = (workerProfile.portfolio as Array<{
    url: string;
    type: string;
    caption?: string;
  }>) || [];

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Sticky Header */}
      <ProfileHeader
        user={{
          id: user.id,
          name: user.profile?.name ?? "Travailleur WorkOn",
          avatarUrl: null,
          rating: workerProfile.completedMissions / 10,
          ratingCount: user.reviewsReceived.length,
          level: 1,
          badges: [],
          completedMissions: workerProfile.completedMissions,
          bio: user.profile?.city ? `Basé à ${user.profile.city}` : null,
        }}
      />

      {/* Portfolio Scroll (TikTok-style) */}
      <div className="pt-32 pb-20">
        {portfolio.length > 0 ? (
          <div className="space-y-4 px-4 max-w-2xl mx-auto">
            {portfolio.map((item, index) => (
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
          <Card className="max-w-2xl mx-auto m-4">
            <CardContent className="p-8 text-center">
              <p className="text-white/70">Aucun portfolio disponible</p>
            </CardContent>
          </Card>
        )}

        {/* Services & Rates */}
        <Card className="max-w-2xl mx-auto m-4">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Services & Tarifs</h2>
            <div className="space-y-3">
              {workerProfile.skills.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{ws.skill.name}</p>
                    <p className="text-sm text-white/50">
                      {ws.skill.category.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-500">
                      ${user.workerProfile!.hourlyRate.toFixed(2)}/h
                    </p>
                    {ws.verified && (
                      <span className="text-xs text-green-400">✓ Vérifié</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        {user.reviewsReceived.length > 0 && (
          <Card className="max-w-2xl mx-auto m-4">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Avis</h2>
              <div className="space-y-4">
                {user.reviewsReceived.map((review) => (
                  <div key={review.id} className="border-b border-white/10 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {review.author.profile?.name ?? "Client WorkOn"}
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-500 text-yellow-500"
                                    : "text-white/20"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-white/70">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CTA Bar (Fixed Bottom) */}
      <div className="fixed bottom-20 left-0 right-0 z-40 border-t border-white/10 bg-neutral-900/90 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-3">
            <Button className="flex-1">Demander devis</Button>
            <Button variant="outline" size="icon">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

