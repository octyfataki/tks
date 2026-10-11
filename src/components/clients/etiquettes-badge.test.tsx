import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EtiquettesBadge, PastilleEtiquette } from "./etiquettes-badge";

// S4 issue #7 — le badge montre les libellés français, jamais un code brut.
// Un code inconnu n'affiche rien.

describe("PastilleEtiquette", () => {
  it("affiche le libellé français de l'étiquette avec sa coche", () => {
    render(<PastilleEtiquette code="BON_PAYEUR" />);
    expect(screen.getByText("Bon payeur")).toBeInTheDocument();
    expect(screen.getByText("Bon payeur").querySelector("svg")).not.toBeNull();
  });

  it("un code inconnu n'affiche rien", () => {
    const { container } = render(<PastilleEtiquette code="MAUVAIS_PAYEUR" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("en variante pastille (tableaux) : libellé seul, sans coche", () => {
    render(<PastilleEtiquette code="BON_PAYEUR" variant="pastille" />);
    const badge = screen.getByText("Bon payeur");
    expect(badge).toBeInTheDocument();
    expect(badge.querySelector("svg")).toBeNull();
  });
});

describe("EtiquettesBadge", () => {
  it("affiche une pastille par étiquette active", () => {
    render(<EtiquettesBadge codes={["A_SURVEILLER", "CLIENT_CONFIANCE"]} />);
    expect(screen.getByText("À surveiller")).toBeInTheDocument();
    expect(screen.getByText("Client de confiance")).toBeInTheDocument();
  });

  it("rien à afficher : rien", () => {
    const { container } = render(<EtiquettesBadge codes={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
