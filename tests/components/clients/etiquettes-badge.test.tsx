import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EtiquettesBadge, PastilleEtiquette } from "@/components/clients/etiquettes-badge";

// S4 issue #7 — le badge montre les libellés français, jamais un code brut.
// Un code inconnu n'affiche rien.

describe("PastilleEtiquette", () => {
  it("affiche le libellé français de l'étiquette", () => {
    render(<PastilleEtiquette code="BON_PAYEUR" />);
    expect(screen.getByText("Bon payeur")).toBeInTheDocument();
  });

  it("un code inconnu n'affiche rien", () => {
    const { container } = render(<PastilleEtiquette code="MAUVAIS_PAYEUR" />);
    expect(container).toBeEmptyDOMElement();
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
