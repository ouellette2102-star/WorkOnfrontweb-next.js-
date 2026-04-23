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
        <MessageCircle className="mb-4 h-12 w-12 text-workon-border" />
        <h3 className="mb-2 text-lg font-semibold text-workon-ink">Aucune conversation</h3>
        <p className="text-sm text-workon-gray">
          Vos conversations apparaîtront ici lorsque vous réserverez une mission
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-workon-border">
      {conversations.map((conv) => {
        // Skip pure conversations — this list component is mission-only legacy UI
        if (!conv.missionId) return null;
        const missionId = conv.missionId;
        const isSelected = missionId === selectedMissionId;
        return (
          <button
            key={missionId}
            onClick={() => onSelect(missionId)}
            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
              isSelected
                ? "bg-workon-primary/10 border-l-2 border-workon-primary"
                : "hover:bg-workon-bg-cream"
            }`}
          >
            {/* Avatar placeholder */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-workon-bg-cream text-sm font-bold text-workon-ink">
              {conv.otherUser.firstName?.[0]?.toUpperCase() ?? "?"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-semibold text-workon-ink">
                  {conv.otherUser.firstName} {conv.otherUser.lastName}
                </p>
                <span className="shrink-0 text-xs text-workon-muted">
                  {formatDistanceToNow(new Date(conv.lastMessageAt), {
                    addSuffix: true,
                    locale: frCA,
                  })}
                </span>
              </div>
              <p className="truncate text-xs text-workon-gray">{conv.missionTitle}</p>
              <p className="mt-0.5 truncate text-sm text-workon-gray">{conv.lastMessage}</p>
            </div>

            {conv.unreadCount > 0 && (
              <span className="mt-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-workon-accent px-1.5 text-[10px] font-bold text-white shadow-sm shadow-workon-accent/40">
                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
