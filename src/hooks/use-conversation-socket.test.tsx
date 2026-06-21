import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Capture the event handlers the hook registers on the socket.
const handlers: Record<string, (...args: unknown[]) => void> = {};
const fakeSocket = {
  on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
    handlers[event] = cb;
  }),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
};
const ioMock = vi.fn(() => fakeSocket);

vi.mock("socket.io-client", () => ({ io: ioMock, Socket: class {} }));
vi.mock("@/lib/env", () => ({ getWebSocketBaseUrl: () => "https://example.test" }));
vi.mock("@/lib/auth", () => ({ getAccessToken: () => "token" }));

const { useConversationSocket } = await import("./use-conversation-socket");

describe("useConversationSocket", () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) delete handlers[k];
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("surfaces only messages for the current conversation", () => {
    const onNewMessage = vi.fn();
    renderHook(() =>
      useConversationSocket({ conversationId: "c1", onNewMessage }),
    );

    // A message for a DIFFERENT conversation must be ignored (the gateway
    // pushes all of a user's DMs to their sockets).
    handlers["conversation_message"]?.({ conversationId: "other", content: "x" });
    expect(onNewMessage).not.toHaveBeenCalled();

    // A message for THIS conversation must surface.
    handlers["conversation_message"]?.({ conversationId: "c1", content: "salut" });
    expect(onNewMessage).toHaveBeenCalledTimes(1);
  });

  it("does not open a socket without a conversationId", () => {
    renderHook(() => useConversationSocket({ conversationId: null }));
    expect(ioMock).not.toHaveBeenCalled();
    expect(handlers["conversation_message"]).toBeUndefined();
  });

  it("subscribes to conversation_message, not the mission new_message event", () => {
    renderHook(() => useConversationSocket({ conversationId: "c1" }));
    expect(fakeSocket.on).toHaveBeenCalledWith(
      "conversation_message",
      expect.any(Function),
    );
    expect(fakeSocket.on).not.toHaveBeenCalledWith(
      "new_message",
      expect.any(Function),
    );
  });
});
