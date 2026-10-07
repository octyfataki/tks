import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProfilUtilisateur } from "./profil-utilisateur";

// Composant piloté par la session : on vérifie l'affichage conditionnel par
// type d'utilisateur, et l'absence de termes interdits (GLOSSARY).
// Les informations vivent dans les onglets : il faut cliquer sur l'onglet
// avant d'assertir son contenu (seul le panneau actif est monté).
function allerOnglet(nom: string) {
  fireEvent.click(screen.getByRole("tab", { name: nom }));
}

describe("ProfilUtilisateur", () => {
  it("affiche le compte client sans dossier avec l'état vide normatif", () => {
    render(
      <ProfilUtilisateur
        nom="Aline Mukendi"
        email="aline@example.com"
        compte={{ type: "CLIENT" }}
        dossier={null}
      />,
    );
    expect(screen.getByRole("heading", { name: "Aline Mukendi" })).toBeInTheDocument();
    allerOnglet("Dossier client");
    expect(screen.getByText("Aucun dossier rattaché : aucun dossier ni solde n'est visible tant que le rattachement n'est pas fait.".replace(/\s+/g, " ").slice(0, 20), { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("Dossier client rattaché")).not.toBeInTheDocument();
  });

  it("affiche le dossier rattaché quand le client est rattaché", () => {
    render(
      <ProfilUtilisateur
        nom="Aline Mukendi"
        email="aline@example.com"
        telephone="+243 810 000 001"
        compte={{ type: "CLIENT" }}
        dossier={{ nom: "Boutique Mukendi", statut: "PRIVILEGIE", adresse: "Kinshasa" }}
      />,
    );
    allerOnglet("Dossier client");
    expect(screen.getByText("Dossier client rattaché")).toBeInTheDocument();
    expect(screen.getByText("Boutique Mukendi")).toBeInTheDocument();
    expect(screen.getByText("PRIVILEGIE")).toBeInTheDocument();
  });

  it("affiche la mission pour un agent et l'administration pour un principal", () => {
    const { rerender } = render(
      <ProfilUtilisateur
        nom="Joel Agent"
        email="joel@example.com"
        compte={{ type: "STAFF", role: "AGENT", etat: "VALIDE" }}
      />,
    );
    allerOnglet("Accès et mission");
    expect(screen.getByText("Mission de terrain")).toBeInTheDocument();
    expect(screen.queryByText("Administration")).not.toBeInTheDocument();

    rerender(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        secondFacteurActif={false}
      />,
    );
    allerOnglet("Accès et mission");
    expect(screen.getByText("Administration")).toBeInTheDocument();
    expect(screen.getAllByText("À activer").length).toBeGreaterThanOrEqual(1);
  });

  it("distingue second facteur inconnu et à activer", () => {
    const { rerender } = render(
      <ProfilUtilisateur
        nom="Chef"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
      />,
    );
    expect(screen.getAllByText("Non vérifié").length).toBeGreaterThanOrEqual(1);

    rerender(
      <ProfilUtilisateur
        nom="Chef"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        secondFacteurActif
      />,
    );
    expect(screen.getAllByText("Actif").length).toBeGreaterThanOrEqual(1);
  });

  it("n'emploie aucun terme interdit du glossaire", () => {
    const { container } = render(
      <ProfilUtilisateur
        nom="Test"
        email="test@example.com"
        compte={{ type: "STAFF", role: "ADMIN_TECHNIQUE", etat: "VALIDE" }}
      />,
    );
    const texte = (container.textContent ?? "").toLowerCase();
    for (const interdit of ["shop", "réalisation", "realisation", "vente", "e-money", "virtuel"]) {
      expect(texte).not.toContain(interdit);
    }
  });
});
