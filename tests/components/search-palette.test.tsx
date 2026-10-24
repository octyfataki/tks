import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { pousse } = vi.hoisted(() => ({ pousse: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pousse }) }));

import { PaletteRecherche } from "@/components/search-palette";

function ouvrir() {
  render(<PaletteRecherche />);
  fireEvent.click(screen.getByRole("button", { name: /ctrl\+k/i }));
}

describe("PaletteRecherche", () => {
  it("affiche un déclencheur avec le raccourci clavier", () => {
    render(<PaletteRecherche />);
    expect(screen.getByRole("button", { name: /ctrl\+k/i })).toHaveTextContent(
      "⌘K",
    );
  });

  it("affiche un déclencheur icône seule sans mention du raccourci", () => {
    render(<PaletteRecherche />);
    const icone = screen.getByRole("button", { name: "Rechercher…" });
    expect(icone).toBeInTheDocument();
    expect(icone).not.toHaveTextContent("⌘K");
    expect(icone).toHaveClass("lg:hidden");
    expect(screen.getByRole("button", { name: /ctrl\+k/i })).toHaveClass(
      "hidden",
      "lg:inline-flex",
    );
    fireEvent.click(icone);
    expect(
      screen.getByRole("dialog", { name: "Recherche" }),
    ).toBeInTheDocument();
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

  it("présente chaque suggestion en card avec sa description", () => {
    ouvrir();
    const titre = screen.getByText("Tableau de bord");
    const card = titre.closest("[cmdk-item]");
    expect(card).toHaveTextContent(
      "Vue d'ensemble de l'activité et des chiffres du jour.",
    );
    expect(card).toHaveClass("rounded-lg", "border", "px-3");
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

  it("masque les séparateurs de groupe pendant une recherche", () => {
    ouvrir();
    expect(screen.getAllByRole("separator").length).toBeGreaterThan(0);
    fireEvent.change(
      screen.getByPlaceholderText(/rechercher une page/i),
      { target: { value: "valider" } },
    );
    expect(screen.queryAllByRole("separator")).toHaveLength(0);
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
