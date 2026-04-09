"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { ConversationList } from "@/components/messages/conversation-list";
import { ConversationThread } from "@/components/messages/conversation-thread";
import { MessageCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * /messages — Centralized messaging page.
 * Mobile: shows list OR thread (not both).
 * Desktop: split view with list + thread side by side.
 */
export default function MessagesPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.getConversations(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF4D1C]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <p className="text-white/70">Connexion requise</p>
          <Link href="/login" className="mt-2 text-[#FF4D1C] underline">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const selectedConversation = conversations?.find(
    (c) => c.missionId === selectedMissionId,
  );

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-neutral-950 text-white md:flex-row">
      {/* Conversation list — hidden on mobile when a thread is selected */}
      <div
        className={`w-full border-r border-white/5 md:w-80 md:block ${
          selectedMissionId ? "hidden" : "block"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <MessageCircle className="h-5 w-5 text-[#FF4D1C]" />
          <h1 className="text-lg font-bold">Messages</h1>
          {conversations && conversations.length > 0 && (
            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
              {conversations.length}
            </span>
          )}
        </div>

        {convsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        ) : (
          <ConversationList
            conversations={conversations || []}
            selectedMissionId={selectedMissionId}
            onSelect={(id) => setSelectedMissionId(id)}
          />
        )}
      </div>

      {/* Thread area */}
      <div
        className={`flex-1 ${
          selectedMissionId ? "block" : "hidden md:block"
        }`}
      >
        {selectedMissionId && selectedConversation ? (
          <div className="flex h-full flex-col">
            {/* Mobile back button */}
            <button
              onClick={() => setSelectedMissionId(null)}
              className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-sm text-white/70 md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux conversations
            </button>
            <div className="flex-1">
              <ConversationThread
                missionId={selectedMissionId}
                missionTitle={selectedConversation.missionTitle}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle className="mb-4 h-16 w-16 text-white/10" />
            <p className="text-white/40">Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
