import { useEffect, useRef } from "react";
import type { Message } from "@/types/mission-chat";
import { MessageBubble } from "./message-bubble";

type MessageListProps = {
  messages: Message[];
  currentUserId: string;
};

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-center">
        <div>
          <div className="mb-4 text-5xl">💬</div>
          <p className="text-white/70">
            Aucun message pour l'instant. Commencez la conversation !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwnMessage={message.senderId === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

