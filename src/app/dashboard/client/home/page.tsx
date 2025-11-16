import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CarouselRow } from "@/components/carousel-row";
import { WorkerCard } from "@/components/worker-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categoryWithWorkers = Prisma.validator<Prisma.CategoryDefaultArgs>()({
  include: {
    skills: {
      include: {
        workerSkills: {
          include: {
            worker: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

type CategoryWithWorkers = Prisma.CategoryGetPayload<typeof categoryWithWorkers>;

export default async function ClientHomePage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Get categories with workers
  const categories = await prisma.category.findMany({
    ...categoryWithWorkers,
    take: 10,
  });

  type WorkerWithRelations =
    CategoryWithWorkers["skills"][number]["workerSkills"][number]["worker"];

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Découvrir travailleurs</h1>
          <p className="text-white/70 mt-2">
            Parcourez les meilleurs travailleurs par catégorie
          </p>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="search"
            placeholder="Rechercher par compétence, nom, localisation..."
            className="w-full px-4 py-3 rounded-lg bg-neutral-800 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Carousels by Category */}
        <div className="space-y-12">
          {categories.map((category) => {
            const workerProfiles: WorkerWithRelations[] = category.skills.flatMap((skill) =>
              skill.workerSkills.map((workerSkill) => workerSkill.worker)
            );
            const workers = workerProfiles
              .filter((worker, index, array) => array.findIndex((w) => w.id === worker.id) === index)
              .slice(0, 20);

            if (workers.length === 0) return null;

            return (
              <CarouselRow
                key={category.id}
                title={category.name}
                items={workers.map((worker) => {
                  const profile = worker.user.profile;
                  return (
                    <WorkerCard
                      key={worker.id}
                      worker={{
                        id: worker.user.id,
                        name: profile?.name ?? "Travailleur WorkOn",
                        avatarUrl: null,
                        rating: worker.completedMissions / 10,
                        ratingCount: worker.completedMissions,
                        level: 1,
                        hourlyRate: worker.hourlyRate,
                      }}
                    />
                  );
                })}
              />
            );
          })}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Aucun travailleur disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">
                Les travailleurs apparaîtront ici une fois qu'ils auront créé leur profil.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

