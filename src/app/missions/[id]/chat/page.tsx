import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MissionChat } from "@/components/chat/mission-chat";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ChatPageProps = {
  params: {
    id: string;
  };
};

export const metadata = {
  title: "Chat Mission - WorkOn",
  description: "Communiquez avec l'autre partie prenante de votre mission",
};

export default async function MissionChatPage({ params }: ChatPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("workon_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const missionId = params.id;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 px-4 py-4">
        <div className="container mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <Link
              href="/missions/mine"
              className="mb-2 inline-block text-sm text-white/70 transition hover:text-red-400"
            >
              ← Retour aux missions
            </Link>
            <h1 className="text-2xl font-bold text-white">Chat Mission</h1>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="container mx-auto flex max-w-4xl flex-1 flex-col py-6">
        <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur">
          <MissionChat missionId={missionId} />
        </div>
      </div>
    </div>
  );
}

