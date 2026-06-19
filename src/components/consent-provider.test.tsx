import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentProvider } from "./consent-provider";

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("@/lib/safe-storage", () => ({
  safeLocalStorage: { isAvailable: vi.fn(() => true) },
}));

vi.mock("@/lib/compliance-api", () => ({
  REQUIRED_LEGAL_DOCUMENTS: ["TERMS", "PRIVACY"],
  normalizeLegalVersions: vi.fn((versions) => ({
    TERMS: versions?.TERMS || "1.0",
    PRIVACY: versions?.PRIVACY || "1.0",
  })),
  isLegalDocumentType: vi.fn((value: string) => ["TERMS", "PRIVACY"].includes(value)),
  getActiveVersions: vi.fn(),
  getConsentStatus: vi.fn(),
  acceptAllDocuments: vi.fn(),
}));

vi.mock("./consent-modal", () => ({
  ConsentModal: ({
    isOpen,
    onAccept,
    missingDocuments,
    statusError,
  }: {
    isOpen: boolean;
    onAccept: () => Promise<void>;
    missingDocuments: string[];
    statusError?: string | null;
  }) =>
    isOpen ? (
      <div data-testid="consent-modal">
        <p>{missingDocuments.join(",")}</p>
        {statusError ? <p>{statusError}</p> : null}
        <button onClick={() => void onAccept().catch(() => {})}>accept</button>
      </div>
    ) : null,
}));

const { useAuth } = await import("@/contexts/auth-context");
const { getAccessToken, refreshToken } = await import("@/lib/auth");
const { safeLocalStorage } = await import("@/lib/safe-storage");
const {
  acceptAllDocuments,
  getActiveVersions,
  getConsentStatus,
} = await import("@/lib/compliance-api");

describe("ConsentProvider", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    vi.mocked(getAccessToken).mockReturnValue("token");
    vi.mocked(refreshToken).mockReset();
    vi.mocked(safeLocalStorage.isAvailable).mockReturnValue(true);
    vi.mocked(getActiveVersions).mockResolvedValue({
      versions: { TERMS: "terms-live", PRIVACY: "privacy-live" },
    });
    vi.mocked(getConsentStatus).mockReset();
    vi.mocked(acceptAllDocuments).mockReset();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("fails closed and opens the modal when consent status cannot be proven", async () => {
    vi.mocked(getConsentStatus).mockRejectedValueOnce(new Error("network"));

    render(
      <ConsentProvider>
        <div>app</div>
      </ConsentProvider>,
    );

    const modal = await screen.findByTestId("consent-modal");
    expect(modal).toHaveTextContent("TERMS,PRIVACY");
    expect(modal).toHaveTextContent("Impossible de vérifier le consentement");
  });

  it("accepts active documents and closes only after status confirms completion", async () => {
    vi.mocked(getConsentStatus)
      .mockResolvedValueOnce({
        isComplete: false,
        documents: {},
        missing: ["TERMS", "PRIVACY"],
      })
      .mockResolvedValueOnce({
        isComplete: true,
        documents: {},
        missing: [],
      });
    vi.mocked(acceptAllDocuments).mockResolvedValueOnce({
      success: true,
      results: [],
    });

    render(
      <ConsentProvider>
        <div>app</div>
      </ConsentProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "accept" }));

    expect(acceptAllDocuments).toHaveBeenCalledWith("token", ["TERMS", "PRIVACY"]);
    await waitFor(() => {
      expect(screen.queryByTestId("consent-modal")).not.toBeInTheDocument();
    });
  });

  it("refreshes a missing token instead of dead-ending, then accepts", async () => {
    // Faithful repro of the iOS Safari bug: token present at load (modal shows
    // because consent is incomplete), but GONE by the time the user clicks
    // accept (15-min expiry / ITP). The modal must recover via refreshToken()
    // and still send the accept, not throw "Non authentifie" before any call.
    vi.mocked(getAccessToken).mockReturnValue("token");
    vi.mocked(getConsentStatus)
      .mockResolvedValueOnce({
        isComplete: false,
        documents: {},
        missing: ["TERMS", "PRIVACY"],
      })
      .mockResolvedValueOnce({
        isComplete: true,
        documents: {},
        missing: [],
      });
    vi.mocked(acceptAllDocuments).mockResolvedValueOnce({
      success: true,
      results: [],
    });
    // refreshToken() succeeds AND persists the token, so getAccessToken()
    // returns it on the subsequent status re-check (as in production).
    vi.mocked(refreshToken).mockImplementationOnce(async () => {
      vi.mocked(getAccessToken).mockReturnValue("fresh-token");
      return "fresh-token";
    });

    render(
      <ConsentProvider>
        <div>app</div>
      </ConsentProvider>,
    );

    const acceptButton = await screen.findByRole("button", { name: "accept" });
    // The token vanishes between render and click.
    vi.mocked(getAccessToken).mockReturnValue(null);
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(refreshToken).toHaveBeenCalled();
    });
    expect(acceptAllDocuments).toHaveBeenCalledWith("fresh-token", [
      "TERMS",
      "PRIVACY",
    ]);
    await waitFor(() => {
      expect(screen.queryByTestId("consent-modal")).not.toBeInTheDocument();
    });
  });

  it("does not send accept when no token can be recovered (routes to re-login)", async () => {
    // refreshToken() fails -> it emits workon:session-expired (handled by
    // AuthProvider -> redirect to /login). The modal must NOT call accept and
    // must not stay stuck on a spinner.
    vi.mocked(getAccessToken).mockReturnValue(null);
    vi.mocked(refreshToken).mockResolvedValueOnce(null);
    vi.mocked(getConsentStatus).mockResolvedValueOnce({
      isComplete: false,
      documents: {},
      missing: ["TERMS", "PRIVACY"],
    });

    render(
      <ConsentProvider>
        <div>app</div>
      </ConsentProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "accept" }));

    await waitFor(() => {
      expect(refreshToken).toHaveBeenCalled();
    });
    expect(acceptAllDocuments).not.toHaveBeenCalled();
  });

  it("guides storage-blocked browsers (in-app WebView) to a real browser", async () => {
    // localStorage blocked -> no token AND no way to persist one. Tell the user
    // to open WorkOn in Safari/Chrome instead of looping "reconnecte-toi".
    vi.mocked(getAccessToken).mockReturnValue(null);
    vi.mocked(safeLocalStorage.isAvailable).mockReturnValue(false);

    render(
      <ConsentProvider>
        <div>app</div>
      </ConsentProvider>,
    );

    const modal = await screen.findByTestId("consent-modal");
    expect(modal).toHaveTextContent("Safari ou Chrome");
  });
});
