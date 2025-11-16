"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMessagesForMission, sendMessage } from "@/lib/mission-chat-api";
import type { Message } from "@/types/mission-chat";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Button } from "@/components/ui/button";

type MissionChatProps = {
  missionId: string;
};

export function MissionChat({ missionId }: MissionChatProps) {
  const { getToken, isLoaded, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!isLoaded || !userId) return;

    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Impossible de récupérer le token");
        return;
      }

      const data = await getMessagesForMission(token, missionId);
      setMessages(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des messages",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, userId, getToken, missionId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSendMessage = async (content: string) => {
    if (!userId) {
      throw new Error("Utilisateur non connecté");
    }

    const token = await getToken();
    if (!token) {
      throw new Error("Impossible de récupérer le token");
    }

    const newMessage = await sendMessage(token, missionId, { content });
    setMessages((prev) => [...prev, newMessage]);
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
          <p className="text-white/70">Chargement du chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="mb-4 text-red-400">{error}</p>
          <Button
            onClick={loadMessages}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <MessageList messages={messages} currentUserId={userId ?? ""} />
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}

