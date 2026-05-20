import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentProvider } from "./consent-provider";

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
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
        <button onClick={() => void onAccept()}>accept</button>
      </div>
    ) : null,
}));

const { useAuth } = await import("@/contexts/auth-context");
const { getAccessToken } = await import("@/lib/auth");
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
    expect(modal).toHaveTextContent("Impossible de verifier le consentement");
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
});
