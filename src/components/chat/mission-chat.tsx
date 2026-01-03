"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMessagesForMission, sendMessage } from "@/lib/mission-chat-api";
import type { Message } from "@/types/mission-chat";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Button } from "@/components/ui/button";

type MissionChatProps = {
  missionId: string;
};

type ChatError = {
  code: string;
  message: string;
};

export function MissionChat({ missionId }: MissionChatProps) {
  const { getToken, isLoaded, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ChatError | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Prevent concurrent loads
  const isLoadingRef = useRef(false);

  // Check if chat is unavailable (501/404)
  const isUnavailable = error?.code === "NOT_IMPLEMENTED" || error?.code === "NOT_FOUND";

  const loadMessages = useCallback(async () => {
    if (!isLoaded || !userId || isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);
      setSendError(null);

      const token = await getToken();
      if (!token) {
        setError({ code: "AUTH_ERROR", message: "Impossible de recuperer le token" });
        return;
      }

      const response = await getMessagesForMission(token, missionId);

      if (response.ok) {
        setMessages(response.data);
        setError(null);
      } else {
        setMessages([]);
        setError(response.error);
      }
    } catch (err) {
      setError({
        code: "UNEXPECTED_ERROR",
        message: err instanceof Error ? err.message : "Erreur inattendue",
      });
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [isLoaded, userId, getToken, missionId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSendMessage = useCallback(
    async (content: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) {
        return { success: false, error: "Utilisateur non connecte" };
      }

      setSendError(null);

      try {
        const token = await getToken();
        if (!token) {
          return { success: false, error: "Token non disponible" };
        }

        const response = await sendMessage(token, missionId, { content });

        if (response.ok) {
          // Append new message
          setMessages((prev) => [...prev, response.data]);
          return { success: true };
        } else {
          setSendError(response.error.message);
          return { success: false, error: response.error.message };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erreur d'envoi";
        setSendError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [userId, getToken, missionId]
  );

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
          <p className="text-white/70">Chargement du chat...</p>
        </div>
      </div>
    );
  }

  // Unavailable state (501/404)
  if (isUnavailable) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-8 text-center">
          <div className="mb-4 text-5xl">💬</div>
          <h3 className="mb-2 text-xl font-bold text-yellow-400">
            Chat non disponible
          </h3>
          <p className="mb-6 text-white/70">
            Le chat pour cette mission n'est pas encore activé.
            Il sera disponible une fois la mission confirmée.
          </p>
          <Button
            onClick={loadMessages}
            variant="outline"
            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
          >
            🔄 Vérifier à nouveau
          </Button>
          {error?.code && (
            <p className="mt-4 text-xs text-white/40">Code: {error.code}</p>
          )}
        </div>
      </div>
    );
  }

  // Error state (other errors)
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <h3 className="mb-2 text-xl font-bold text-red-400">
            Erreur de chargement
          </h3>
          <p className="mb-6 text-white/70">{error.message}</p>
          <Button
            onClick={loadMessages}
            className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500"
          >
            🔄 Réessayer
          </Button>
          {error.code && (
            <p className="mt-4 text-xs text-white/40">Code: {error.code}</p>
          )}
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="flex h-full flex-col">
      {/* Send error banner */}
      {sendError && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-center text-sm text-red-400">
          ⚠️ {sendError}
          <button
            onClick={() => setSendError(null)}
            className="ml-2 text-xs underline hover:no-underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Messages or empty */}
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <div className="mb-4 text-5xl">💬</div>
            <p className="text-white/70">
              Aucun message pour le moment.
              <br />
              Commencez la conversation !
            </p>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} currentUserId={userId ?? ""} />
      )}

      {/* Input */}
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}
