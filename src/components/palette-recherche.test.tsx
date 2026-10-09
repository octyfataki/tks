import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { pousse } = vi.hoisted(() => ({ pousse: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pousse }) }));

import { PaletteRecherche } from "./palette-recherche";

function ouvrir() {
  render(<PaletteRecherche />);
  fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
}

describe("PaletteRecherche", () => {
  it("affiche un déclencheur avec le raccourci clavier", () => {
    render(<PaletteRecherche />);
    expect(screen.getByRole("button", { name: /rechercher/i })).toHaveTextContent(
      "⌘K",
    );
  });

  it("ouvre le dialogue avec les groupes du projet", () => {
    ouvrir();
    expect(
      screen.getByRole("dialog", { name: "Recherche" }),
    ).toBeInTheDocument();
    for (const groupe of [
      "Pilotage",
      "Accès",
      "Clients et crédit",
      "Opérations",
      "Trésorerie et taux",
    ]) {
      expect(screen.getByText(groupe)).toBeInTheDocument();
    }
    expect(screen.getByText("Comptes clients")).toBeInTheDocument();
    expect(screen.getByText("Taux de change")).toBeInTheDocument();
  });

  it("navigue vers l'écran choisi et referme le dialogue", () => {
    ouvrir();
    fireEvent.change(
      screen.getByPlaceholderText(/rechercher une page/i),
      { target: { value: "valider" } },
    );
    fireEvent.click(screen.getByText("Validation des comptes clients"));
    expect(pousse).toHaveBeenCalledWith("/admin/clients/validation");
    expect(
      screen.queryByRole("dialog", { name: "Recherche" }),
    ).not.toBeInTheDocument();
  });

  it("marque les écrans à venir désactivés avec Bientôt", () => {
    ouvrir();
    const taux = screen.getByText("Taux de change").closest("[data-disabled]");
    expect(taux).toHaveAttribute("data-disabled", "true");
    expect(screen.getAllByText("Bientôt").length).toBeGreaterThan(0);
  });

  it("annonce l'absence de résultat et la recherche S4 à venir", () => {
    ouvrir();
    fireEvent.change(
      screen.getByPlaceholderText(/rechercher une page/i),
      { target: { value: "zzz-introuvable" } },
    );
    expect(screen.getByText(/aucun résultat/i)).toBeInTheDocument();
    expect(screen.getByText(/tranche S4/i)).toBeInTheDocument();
  });
});
