import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientNetworkCard } from "@/app/clients/pricing/network-card";
import type { ClientPriceEntry } from "@/app/clients/pricing/pricing-display";

const prix: ClientPriceEntry = {
  amountLabel: "2 350 CDF",
  equivalentLabel: "≈ 1,02 USD",
  effectiveAtLabel: "19 oct. 2026, 09:12",
};

describe("carte tarif client", () => {
  it("affiche le prix natif, l'équivalent et la date", () => {
    render(<ClientNetworkCard network="ORANGE" price={prix} />);

    expect(screen.getByText("Orange")).toBeInTheDocument();
    expect(screen.getByText("2 350 CDF")).toBeInTheDocument();
    expect(screen.getByText("≈ 1,02 USD")).toBeInTheDocument();
    expect(screen.getByText(/19 oct. 2026/)).toBeInTheDocument();
    expect(screen.getByText("En vigueur")).toBeInTheDocument();
  });

  it("marque un réseau sans prix indisponible", () => {
    render(<ClientNetworkCard network="VODACOM" price={null} />);

    expect(screen.getByText("Vodacom")).toBeInTheDocument();
    expect(screen.getByText("Indisponible")).toBeInTheDocument();
    expect(screen.getByText(/Aucun prix publié/)).toBeInTheDocument();
    expect(screen.queryByText("En vigueur")).toBeNull();
  });

  it("n'affiche ni action de commande ni lien", () => {
    render(<ClientNetworkCard network="AIRTEL" price={prix} />);

    expect(screen.queryByText("Modifier")).toBeNull();
    expect(screen.queryByText("Commander")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
