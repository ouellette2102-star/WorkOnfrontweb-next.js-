"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";

type MessageInputProps = {
  onSend: (content: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending || disabled) return;

    setIsSending(true);
    setError(null);

    try {
      const result = await onSend(trimmed);

      if (result.success) {
        setContent(""); // Clear input only on success
        setError(null);
      } else {
        // Keep the text so user can retry
        setError(result.error ?? "Erreur d'envoi");
      }
    } catch (err) {
      // Keep the text so user can retry
      setError(err instanceof Error ? err.message : "Erreur d'envoi");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-[#EAE6DF] bg-white/80 p-4">
      {/* Error message */}
      {error && (
        <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-xs underline hover:no-underline"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSending || disabled}
          placeholder="Ecris ton message... (Entree pour envoyer)"
          className={`flex-1 resize-none rounded-2xl border px-4 py-3 text-[#1B1A18] placeholder:text-[#9C9A96] focus:outline-none disabled:opacity-50 ${
            error
              ? "border-red-500/30 bg-red-500/5 focus:border-[#134021]"
              : "border-[#EAE6DF] bg-white focus:border-[#134021]"
          }`}
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending || disabled}
          className="self-end rounded-2xl bg-[#134021] px-6 py-3 font-semibold text-white transition hover:bg-[#1a5a2e] disabled:opacity-50"
        >
          {isSending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </span>
          ) : (
            "Envoyer"
          )}
        </Button>
      </div>

      {/* Character count */}
      {content.length > 0 && (
        <p className="mt-2 text-xs text-[#9C9A96]">
          {content.length} caractère{content.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
