import Link from "next/link";
import type { Mission } from "@/types/mission";
import { Button } from "@/components/ui/button";

type MissionActionsProps = {
  mission: Mission;
  showChatButton?: boolean;
};

export function MissionActions({
  mission,
  showChatButton = true,
}: MissionActionsProps) {
  // Le chat est disponible uniquement si la mission est RESERVED, IN_PROGRESS, ou COMPLETED
  // et qu'un worker est assigné
  const canAccessChat =
    showChatButton &&
    mission.workerId &&
    ["RESERVED", "IN_PROGRESS", "COMPLETED"].includes(mission.status);

  if (!canAccessChat) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Link href={`/missions/${mission.id}/chat`} className="flex-1">
        <Button className="w-full rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500">
          💬 Ouvrir le chat
        </Button>
      </Link>
    </div>
  );
}

