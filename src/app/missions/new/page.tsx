import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateMissionForm } from "@/components/missions/create-mission-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Créer une mission - WorkOn",
  description: "Publie une nouvelle mission pour trouver des travailleurs qualifiés",
};

export default async function NewMissionPage() {
  const session = await auth();

  if (!session.userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-neutral-900 py-12">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Créer une mission
          </h1>
          <p className="text-white/70">
            Publie une mission pour trouver rapidement des travailleurs qualifiés
          </p>
        </div>

        {/* Formulaire */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur">
          <CreateMissionForm />
        </div>
      </div>
    </div>
  );
}

