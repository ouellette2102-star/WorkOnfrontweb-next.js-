import type { Message } from "@/types/mission-chat";
import { MessageSenderRole } from "@/types/mission-chat";

type MessageBubbleProps = {
  message: Message;
  isOwnMessage: boolean;
};

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const formattedTime = new Date(message.createdAt).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const roleLabel =
    message.senderRole === MessageSenderRole.EMPLOYER
      ? "Employeur"
      : "Travailleur";

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isOwnMessage
            ? "bg-red-600 text-white"
            : "border border-white/10 bg-white/5 text-white"
        }`}
      >
        {!isOwnMessage && (
          <p className="mb-1 text-xs font-semibold opacity-70">{roleLabel}</p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </p>
        <p
          className={`mt-2 text-xs ${isOwnMessage ? "text-white/70" : "text-white/50"}`}
        >
          {formattedTime}
        </p>
      </div>
    </div>
  );
}

