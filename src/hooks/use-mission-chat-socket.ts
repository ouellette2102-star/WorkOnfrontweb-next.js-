"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getWebSocketBaseUrl } from "@/lib/env";
import { getAccessToken } from "@/lib/auth";

/**
 * Real-time chat over Socket.IO for the canonical messages center.
 *
 * Backend contract (verified live 2026-04-08 against
 * workon-backend-production-8908; see also `docs/BACKEND_PIPELINE.md`):
 *
 *   - Namespace: `/chat`
 *   - Auth: JWT in `query.token` (extracted by the gateway as
 *     `payload.userId || payload.sub`)
 *   - Room convention: `mission:{missionId}`, joined by emitting
 *     `join_mission` with `{ missionId }`
 *   - Server emits `new_message` to the room when a message is
 *     persisted (the WS path writes to Postgres directly via
 *     messagesService.createMessage, so no double-write needed)
 *
 * Design notes:
 *
 *   - This hook is purely a RECEIVE channel. Sending messages goes
 *     through the existing HTTP path (`api.sendMessage`) so we keep
 *     the optimistic UI + retry semantics that React Query already
 *     handles, and so the existing fallback path stays intact.
 *
 *   - The hook NEVER throws on connection failure. If WS cannot
 *     connect (CORS issue, token expired, network blocked), the
 *     consuming component still has its HTTP polling fallback —
 *     no crash, no error boundary, just degraded latency.
 *
 *   - Cleanup is symmetric: on unmount we leave the room and
 *     disconnect, so the socket count on the gateway stays accurate.
 *
 *   - Reconnection is handled by socket.io-client automatically
 *     (default 5 attempts with exponential backoff). Auth is bound
 *     to the connection so a token rotation mid-session would
 *     require a manual reconnect — we accept this trade-off for
 *     PR scope (the polling fallback covers it).
 */

type ChatSocketStatus = "idle" | "connecting" | "connected" | "error" | "disconnected";

type UseMissionChatSocketOptions = {
  missionId: string | null;
  /** Called every time the gateway emits `new_message` for this mission. */
  onNewMessage?: (message: unknown) => void;
  /** Called if the gateway emits an `error` event or the connection fails. */
  onError?: (message: string) => void;
  /** Set to false to disable the hook entirely (e.g. when the user is not authenticated). */
  enabled?: boolean;
};

export function useMissionChatSocket({
  missionId,
  onNewMessage,
  onError,
  enabled = true,
}: UseMissionChatSocketOptions): { status: ChatSocketStatus; isConnected: boolean } {
  const [status, setStatus] = useState<ChatSocketStatus>("idle");
  const socketRef = useRef<Socket | null>(null);

  // Keep latest callbacks in refs so changes don't tear down the socket
  const onNewMessageRef = useRef(onNewMessage);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!enabled || !missionId) {
      setStatus("idle");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setStatus("idle");
      return;
    }

    const baseUrl = getWebSocketBaseUrl();
    if (!baseUrl) {
      setStatus("error");
      return;
    }

    setStatus("connecting");

    const socket = io(`${baseUrl}/chat`, {
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10_000,
      autoConnect: true,
      // We pass the JWT in query rather than cookies because the
      // backend gateway reads `client.handshake.query.token`.
      withCredentials: false,
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setStatus("connected");
      socket.emit("join_mission", { missionId });
    };

    const handleDisconnect = () => {
      setStatus("disconnected");
    };

    const handleConnectError = (err: Error) => {
      // Don't blow up the UI — the polling fallback in the consuming
      // component will keep things working. We just log a single warn
      // so it's debuggable in DevTools without spamming.
      // eslint-disable-next-line no-console
      console.warn("[chat-socket] connect error:", err.message);
      setStatus("error");
      onErrorRef.current?.(err.message);
    };

    const handleNewMessage = (message: unknown) => {
      onNewMessageRef.current?.(message);
    };

    const handleServerError = (payload: { message?: string }) => {
      // eslint-disable-next-line no-console
      console.warn("[chat-socket] server error:", payload?.message ?? "unknown");
      setStatus("error");
      onErrorRef.current?.(payload?.message ?? "Erreur du serveur de chat");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("new_message", handleNewMessage);
    socket.on("error", handleServerError);

    return () => {
      try {
        if (socket.connected) {
          socket.emit("leave_mission", { missionId });
        }
      } catch {
        // Best-effort; ignore.
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("new_message", handleNewMessage);
      socket.off("error", handleServerError);
      socket.disconnect();
      socketRef.current = null;
    };
    // We intentionally only re-run when missionId or enabled flips.
    // The callback refs above keep onNewMessage / onError fresh
    // without tearing down the socket on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, enabled]);

  const isConnected = status === "connected";

  return useStableReturn(status, isConnected);
}

// Tiny stability helper — keeps the returned object reference equal
// across renders when nothing changed, so consumers using the result
// in their own deps don't trigger unnecessary effects.
function useStableReturn(status: ChatSocketStatus, isConnected: boolean) {
  const ref = useRef({ status, isConnected });
  if (ref.current.status !== status || ref.current.isConnected !== isConnected) {
    ref.current = { status, isConnected };
  }
  return ref.current;
}
