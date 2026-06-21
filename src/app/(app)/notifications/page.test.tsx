import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationsPage from "./page";
import { api } from "@/lib/api-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/api-client", () => ({
  api: {
    getNotifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}));

function renderNotificationsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationsPage />
    </QueryClientProvider>,
  );
}

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error state and retries loading notifications", async () => {
    vi.mocked(api.getNotifications)
      .mockRejectedValueOnce(new Error("backend unavailable"))
      .mockResolvedValueOnce([]);

    renderNotificationsPage();

    expect(
      await screen.findByText("Impossible de charger les notifications"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Réessayer/i }));

    await waitFor(() => {
      expect(api.getNotifications).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Aucune notification pour le moment")).toBeInTheDocument();
  });
});
