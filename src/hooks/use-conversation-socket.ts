"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getWebSocketBaseUrl } from "@/lib/env";
import { getAccessToken } from "@/lib/auth";

/**
 * Real-time RECEIVE channel for a single DM (post-swipe-match conversation).
 *
 * Backend contract (workon-backend ChatGateway): a new conversation message is
 * pushed directly to each participant's sockets via `emitToUsers` under the
 * event `conversation_message` (distinct from the mission chat's room-scoped
 * `new_message`, so DM traffic never leaks into the mission listener). There is
 * no room to join — delivery is targeted at the participant's own sockets.
 *
 * Like `useMissionChatSocket`, this is a RECEIVE-only channel: sending stays on
 * the HTTP path (`api.sendConversationMessage`) for optimistic UI + retries, and
 * the hook NEVER throws on connection failure — the consuming screen keeps its
 * HTTP polling fallback, so a dead socket only means slightly higher latency.
 */

type ChatSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "disconnected";

type ConversationMessage = { conversationId?: string } & Record<string, unknown>;

type UseConversationSocketOptions = {
  conversationId: string | null;
  /** Called when a `conversation_message` for THIS conversation arrives. */
  onNewMessage?: (message: ConversationMessage) => void;
  /** Called if the gateway emits an `error` event or the connection fails. */
  onError?: (message: string) => void;
  /** Set to false to disable the hook entirely (e.g. user not authenticated). */
  enabled?: boolean;
};

export function useConversationSocket({
  conversationId,
  onNewMessage,
  onError,
  enabled = true,
}: UseConversationSocketOptions): {
  status: ChatSocketStatus;
  isConnected: boolean;
} {
  const [status, setStatus] = useState<ChatSocketStatus>("idle");
  const socketRef = useRef<Socket | null>(null);

  const onNewMessageRef = useRef(onNewMessage);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const setStatusAfterEffect = (next: ChatSocketStatus) => {
      queueMicrotask(() => setStatus(next));
    };

    if (!enabled || !conversationId) {
      setStatusAfterEffect("idle");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setStatusAfterEffect("idle");
      return;
    }

    const baseUrl = getWebSocketBaseUrl();
    if (!baseUrl) {
      setStatusAfterEffect("error");
      return;
    }

    setStatusAfterEffect("connecting");

    const socket = io(`${baseUrl}/chat`, {
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10_000,
      autoConnect: true,
      withCredentials: false,
    });

    socketRef.current = socket;

    const handleConnect = () => setStatus("connected");
    const handleDisconnect = () => setStatus("disconnected");
    const handleConnectError = (err: Error) => {
      console.warn("[conversation-socket] connect error:", err.message);
      setStatus("error");
      onErrorRef.current?.(err.message);
    };
    const handleConversationMessage = (message: ConversationMessage) => {
      // The gateway pushes a user's DMs to ALL their sockets, so a message for
      // a different thread can land here — only surface this conversation's.
      if (!message || message.conversationId !== conversationId) return;
      onNewMessageRef.current?.(message);
    };
    const handleServerError = (payload: { message?: string }) => {
      console.warn(
        "[conversation-socket] server error:",
        payload?.message ?? "unknown",
      );
      setStatus("error");
      onErrorRef.current?.(payload?.message ?? "Erreur du serveur de chat");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("conversation_message", handleConversationMessage);
    socket.on("error", handleServerError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("conversation_message", handleConversationMessage);
      socket.off("error", handleServerError);
      socket.disconnect();
      socketRef.current = null;
    };
    // Only re-run when the conversation or enabled flag changes; callback refs
    // keep onNewMessage / onError fresh without tearing down the socket.
  }, [conversationId, enabled]);

  const isConnected = status === "connected";

  return useMemo(() => ({ status, isConnected }), [status, isConnected]);
}
