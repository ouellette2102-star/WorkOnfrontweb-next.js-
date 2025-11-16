"use client";

import { useState, useTransition, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";

type MessageInputProps = {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || isPending || disabled) return;

    startTransition(async () => {
      try {
        await onSend(trimmed);
        setContent(""); // Clear input on success
      } catch (error) {
        // Error is handled by parent component
        console.error("Error sending message:", error);
      }
    });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-white/10 bg-neutral-900/50 p-4">
      <div className="flex gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isPending || disabled}
          placeholder="Écris ton message... (Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne)"
          className="flex-1 resize-none rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-white placeholder:text-white/50 focus:border-red-500 focus:outline-none disabled:opacity-50"
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isPending || disabled}
          className="self-end rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          {isPending ? "..." : "Envoyer"}
        </Button>
      </div>
    </div>
  );
}

