import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MissionCard } from "@/components/mission-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const missionWithRelations = Prisma.validator<Prisma.MissionDefaultArgs>()({
  include: {
    category: true,
    authorClient: {
      include: {
        profile: true,
      },
    },
  },
});

type MissionWithRelations = Prisma.MissionGetPayload<typeof missionWithRelations>;

export default async function WorkerHomePage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return null;
  }

  // Get nearby missions
  const missions = await prisma.mission.findMany({
    where: {
      status: "OPEN",
      deletedAt: null,
    },
    ...missionWithRelations,
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Missions près de moi</h1>
          <p className="text-white/70 mt-2">
            Trouve ta prochaine mission
          </p>
        </header>

        {/* Map placeholder */}
        <div className="mb-8 h-64 rounded-lg bg-neutral-800 border border-white/10 flex items-center justify-center">
          <p className="text-white/50">Carte interactive (Mapbox)</p>
        </div>

        {/* Missions List */}
        <div className="space-y-4">
          {missions.map((mission: MissionWithRelations) => (
            <MissionCard
              key={mission.id}
              mission={{
                id: mission.id,
                title: mission.title,
                description: mission.description,
                category: mission.category.name,
                location: mission.locationAddress || "Adresse non spécifiée",
                budgetMin: mission.budgetMin,
                budgetMax: mission.budgetMax,
                priceType: mission.priceType as "FIXED" | "HOURLY",
                status: mission.status,
                createdAt: mission.createdAt,
              }}
            />
          ))}
        </div>

        {missions.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Aucune mission disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">
                Les nouvelles missions apparaîtront ici.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

