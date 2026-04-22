/**
 * Unit tests for the unified <MissionCard> component.
 *
 * Covers the two personas (pro/client) and the three visual signals
 * (urgent / new / boosted) that drive the top-of-card badge and
 * border accent.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MissionCard, type MissionCardInput } from "./mission-card";

const base: MissionCardInput = {
  id: "m_1",
  title: "Plombier pour fuite sous l'évier",
  category: "plumbing",
  city: "Montréal",
  // 10 days ago → not "new", no ambiguity with the 6h threshold.
  createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  description: "Fuite sous évier de cuisine, besoin rapide.",
  status: "open",
  price: 180,
  distanceKm: 2.5,
};

describe("<MissionCard />", () => {
  it("renders pro variant with 'Postuler' CTA by default", () => {
    render(<MissionCard mission={base} />);
    const cta = screen.getByTestId("mission-card-cta");
    expect(cta).toHaveTextContent(/Postuler/);
    expect(screen.getByTestId("mission-card")).toHaveAttribute(
      "data-variant",
      "pro",
    );
  });

  it("renders client variant with 'Recevoir des offres' CTA", () => {
    render(<MissionCard mission={base} variant="client" />);
    const cta = screen.getByTestId("mission-card-cta");
    expect(cta).toHaveTextContent(/Recevoir des offres/);
    expect(screen.getByTestId("mission-card")).toHaveAttribute(
      "data-variant",
      "client",
    );
  });

  it("hides CTA when showCTA is false", () => {
    render(<MissionCard mission={base} showCTA={false} />);
    expect(screen.queryByTestId("mission-card-cta")).toBeNull();
  });

  it("shows distance in the budget hero when provided", () => {
    render(<MissionCard mission={base} />);
    const budget = screen.getByTestId("mission-card-budget");
    expect(budget).toHaveTextContent(/2\.5 km/);
  });

  it("shows the title and price inside the budget hero", () => {
    render(<MissionCard mission={base} />);
    expect(screen.getByTestId("mission-card-title")).toHaveTextContent(
      /Plombier pour fuite/,
    );
    expect(screen.getByTestId("mission-card-budget")).toHaveTextContent(
      /180\$/,
    );
  });

  it("uses 'Gain potentiel' label for pro variant and 'Estimation' for client", () => {
    const { rerender } = render(<MissionCard mission={base} variant="pro" />);
    expect(screen.getByTestId("mission-card-budget")).toHaveTextContent(
      /Gain potentiel/i,
    );
    rerender(<MissionCard mission={base} variant="client" />);
    expect(screen.getByTestId("mission-card-budget")).toHaveTextContent(
      /Estimation/i,
    );
  });

  it("falls back to priceRange when price is absent (PublicMission shape)", () => {
    const publicShape: MissionCardInput = {
      ...base,
      price: undefined,
      priceRange: "$80–$120",
    };
    render(<MissionCard mission={publicShape} />);
    expect(screen.getByTestId("mission-card-budget")).toHaveTextContent(
      "$80–$120",
    );
  });

  it("omits the budget hero when no price is available", () => {
    const noPrice: MissionCardInput = {
      ...base,
      price: undefined,
      priceRange: undefined,
    };
    render(<MissionCard mission={noPrice} />);
    expect(screen.queryByTestId("mission-card-budget")).toBeNull();
  });

  it("renders the Urgent badge when isUrgent is true", () => {
    render(<MissionCard mission={{ ...base, isUrgent: true }} />);
    expect(screen.getByTestId("mission-urgent-badge")).toBeInTheDocument();
    expect(screen.getByTestId("mission-card")).toHaveAttribute(
      "data-urgent",
      "true",
    );
  });

  it("renders the Nouveau badge when created within the last 6h", () => {
    const fresh: MissionCardInput = {
      ...base,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    };
    render(<MissionCard mission={fresh} />);
    expect(screen.getByTestId("mission-new-badge")).toBeInTheDocument();
  });

  it("renders the Top badge when boosted (and not urgent/new)", () => {
    const boosted: MissionCardInput = {
      ...base,
      boostedUntil: new Date(Date.now() + 60_000).toISOString(),
    };
    render(<MissionCard mission={boosted} />);
    expect(screen.getByTestId("mission-boosted-badge")).toBeInTheDocument();
  });

  it("urgent badge takes precedence over new/boosted", () => {
    const freshAndBoosted: MissionCardInput = {
      ...base,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      boostedUntil: new Date(Date.now() + 60_000).toISOString(),
      isUrgent: true,
    };
    render(<MissionCard mission={freshAndBoosted} />);
    expect(screen.getByTestId("mission-urgent-badge")).toBeInTheDocument();
    expect(screen.queryByTestId("mission-new-badge")).toBeNull();
    expect(screen.queryByTestId("mission-boosted-badge")).toBeNull();
  });

  it("applies the cancelled visual state and hides CTA", () => {
    const cancelled: MissionCardInput = { ...base, status: "cancelled" };
    render(<MissionCard mission={cancelled} />);
    expect(screen.queryByTestId("mission-card-cta")).toBeNull();
    // Status label is rendered
    expect(screen.getByText(/Annulée/)).toBeInTheDocument();
  });
});
