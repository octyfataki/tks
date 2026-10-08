import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EcranErreur } from "./ecran-erreur";

describe("EcranErreur", () => {
  it("affiche le repère, le titre de niveau 1 et le message", () => {
    render(
      <EcranErreur
        code="404"
        titre="Cette page n'existe pas"
        message="Vos commandes sont inchangées."
        actions={<button type="button">Retour</button>}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Cette page n'existe pas",
    );
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Vos commandes sont inchangées.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retour" })).toBeInTheDocument();
  });

  it("n'emploie aucun terme interdit du prototype Excel", () => {
    const { container } = render(
      <EcranErreur
        code="404"
        titre="Cette page n'existe pas"
        message="Vos commandes, créances et paiements sont inchangés."
        actions={<button type="button">Retour</button>}
      />,
    );
    const texte = (container.textContent ?? "").toLowerCase();
    for (const interdit of ["shop", "réalisation", "vente", "virtuel", "facture", "e-money"]) {
      expect(texte).not.toContain(interdit);
    }
  });
});
