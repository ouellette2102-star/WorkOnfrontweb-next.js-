/**
 * Unit tests for the mission chat thread page.
 *
 * Focus: verify the socket path works end-to-end in-memory — an
 * incoming `new_message` from the gateway is appended to the
 * thread immediately, the live badge flips to "Live", and a
 * socket-ignored message for another mission is dropped.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// --- Mocks ---------------------------------------------------------------

const mockUseParams = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
}));

const mockUseAuth = vi.fn();
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/api-client", () => ({
  api: {
    getThread: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn(),
    markRead: vi.fn().mockResolvedValue(undefined),
  },
}));

// Capture the options passed to the hook so tests can drive it.
const socketCalls: Array<{
  missionId: string | null;
  enabled: boolean;
  onNewMessage?: (msg: unknown) => void;
}> = [];

// Mutable status returned from the mocked hook between tests.
let mockStatus: "idle" | "connecting" | "connected" | "error" | "disconnected" = "connected";
let mockIsConnected = true;

vi.mock("@/hooks/use-mission-chat-socket", () => ({
  useMissionChatSocket: (opts: {
    missionId: string | null;
    enabled: boolean;
    onNewMessage?: (msg: unknown) => void;
  }) => {
    socketCalls.push(opts);
    return { status: mockStatus, isConnected: mockIsConnected };
  },
}));

// Import AFTER mocks are set up.
import ChatThreadPage from "./page";

function wrap(children: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("ChatThreadPage — Socket.IO integration", () => {
  beforeEach(() => {
    socketCalls.length = 0;
    mockStatus = "connected";
    mockIsConnected = true;
    mockUseParams.mockReturnValue({ missionId: "m_abc12345" });
    mockUseAuth.mockReturnValue({
      user: { id: "u_me" },
      isAuthenticated: true,
    });
  });

  it("wires the socket with the current missionId and enabled=true when authenticated", () => {
    render(wrap(<ChatThreadPage />));
    expect(socketCalls.length).toBeGreaterThan(0);
    const last = socketCalls[socketCalls.length - 1];
    expect(last.missionId).toBe("m_abc12345");
    expect(last.enabled).toBe(true);
  });

  it("renders the Live badge when socket isConnected", () => {
    render(wrap(<ChatThreadPage />));
    const badge = screen.getByTestId("chat-live-status");
    expect(badge.getAttribute("data-status")).toBe("connected");
    expect(badge.textContent).toContain("Live");
  });

  it("renders a Polling label when socket is idle", () => {
    mockStatus = "idle";
    mockIsConnected = false;
    render(wrap(<ChatThreadPage />));
    const badge = screen.getByTestId("chat-live-status");
    expect(badge.getAttribute("data-status")).toBe("idle");
    expect(badge.textContent).toContain("Polling");
  });

  it("appends an incoming new_message from the socket into the thread", async () => {
    render(wrap(<ChatThreadPage />));
    const opts = socketCalls[socketCalls.length - 1];
    expect(opts.onNewMessage).toBeTypeOf("function");

    // Simulate gateway pushing a message into the room.
    act(() => {
      opts.onNewMessage!({
        id: "msg_live_1",
        missionId: "m_abc12345",
        senderId: "u_other",
        senderRole: "employer",
        content: "Hello live 👋",
        status: "SENT",
        createdAt: new Date().toISOString(),
      });
    });

    expect(await screen.findByText(/Hello live/)).toBeInTheDocument();
  });

  it("drops a new_message whose missionId does not match the current room", async () => {
    render(wrap(<ChatThreadPage />));
    const opts = socketCalls[socketCalls.length - 1];

    act(() => {
      opts.onNewMessage!({
        id: "msg_wrong_room",
        missionId: "m_zzzz",
        senderId: "u_other",
        senderRole: "employer",
        content: "Should not appear",
        status: "SENT",
        createdAt: new Date().toISOString(),
      });
    });

    // findBy waits up to 1s — ensure nothing renders.
    expect(screen.queryByText(/Should not appear/)).toBeNull();
  });

  it("deduplicates when the same message arrives twice on the socket", () => {
    render(wrap(<ChatThreadPage />));
    const opts = socketCalls[socketCalls.length - 1];
    const payload = {
      id: "msg_dup",
      missionId: "m_abc12345",
      senderId: "u_other",
      senderRole: "employer",
      content: "only once",
      status: "SENT",
      createdAt: new Date().toISOString(),
    };

    act(() => {
      opts.onNewMessage!(payload);
      opts.onNewMessage!(payload);
    });

    const hits = screen.getAllByText("only once");
    expect(hits).toHaveLength(1);
  });
});
