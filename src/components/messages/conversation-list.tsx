"use client";

import { formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";
import { MessageCircle } from "lucide-react";
import type { ConversationItem } from "@/lib/api-client";

type Props = {
  conversations: ConversationItem[];
  selectedMissionId: string | null;
  onSelect: (missionId: string) => void;
};

export function ConversationList({ conversations, selectedMissionId, onSelect }: Props) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageCircle className="mb-4 h-12 w-12 text-white/20" />
        <h3 className="mb-2 text-lg font-semibold text-white">Aucune conversation</h3>
        <p className="text-sm text-white/50">
          Vos conversations apparaîtront ici lorsque vous réserverez une mission
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {conversations.map((conv) => {
        const isSelected = conv.missionId === selectedMissionId;
        return (
          <button
            key={conv.missionId}
            onClick={() => onSelect(conv.missionId)}
            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
              isSelected
                ? "bg-red-500/10 border-l-2 border-red-500"
                : "hover:bg-white/5"
            }`}
          >
            {/* Avatar placeholder */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
              {conv.otherUser.firstName?.[0]?.toUpperCase() ?? "?"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-semibold text-white">
                  {conv.otherUser.firstName} {conv.otherUser.lastName}
                </p>
                <span className="shrink-0 text-xs text-white/40">
                  {formatDistanceToNow(new Date(conv.lastMessageAt), {
                    addSuffix: true,
                    locale: frCA,
                  })}
                </span>
              </div>
              <p className="truncate text-xs text-white/50">{conv.missionTitle}</p>
              <p className="mt-0.5 truncate text-sm text-white/70">{conv.lastMessage}</p>
            </div>

            {conv.unreadCount > 0 && (
              <span className="mt-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
