import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProfilUtilisateur } from "./profil-utilisateur";
import { FormulaireMonProfil } from "@/app/admin/profil/formulaire-mon-profil";
import { ActivationSecondFacteur } from "./activation-second-facteur";

vi.mock("@/app/admin/profil/actions", () => ({
  modifierPhotoProfilAction: vi.fn(),
  supprimerPhotoProfilAction: vi.fn(),
  deconnecterAutresSessionsAction: vi.fn(),
  modifierMonProfilAction: vi.fn(),
  confirmerSecondFacteurAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mon compte, sans onglets : tout est visible en lecture seule, dans le même
// langage que la fiche /admin/list/[id]. On vérifie l'affichage conditionnel
// par type d'utilisateur, et l'absence de termes interdits (GLOSSARY).
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
    expect(
      screen.getByText(/aucun dossier rattaché/i),
    ).toBeInTheDocument();
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
    expect(screen.getByText("Boutique Mukendi")).toBeInTheDocument();
    expect(screen.getByText("Privilégié")).toBeInTheDocument();
  });

  it("affiche la mission pour un agent et l'administration pour un principal", () => {
    const { rerender } = render(
      <ProfilUtilisateur
        nom="Joel Agent"
        email="joel@example.com"
        compte={{ type: "STAFF", role: "AGENT", etat: "VALIDE" }}
      />,
    );
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

  it("affiche le bandeau registre quand les données sont connues", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        telephone="+243 810 000 002"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        matricule="ABCDEF12"
        creeLe={new Date("2024-03-02T10:00:00Z")}
        creePar="Système (bootstrap)"
      />,
    );
    expect(screen.getByText(/Matricule ABCDEF12/i)).toBeInTheDocument();
    expect(screen.getByText("Système (bootstrap)")).toBeInTheDocument();
    expect(screen.getAllByText("Administrateur principal").length).toBeGreaterThanOrEqual(1);
  });

  it("propose de modifier la photo du compte", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Modifier la photo" })).toBeInTheDocument();
  });

  it("affiche les sessions en cours avec la session actuelle marquée", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        sessionActuelleId="session-ici"
        sessions={[
          {
            id: "session-ici",
            appareil: "Navigateur du bureau",
            adresse: "192.0.2.10",
            creeLe: new Date("2024-03-02T10:00:00Z"),
            expireLe: new Date("2024-03-09T10:00:00Z"),
          },
          {
            id: "session-ailleurs",
            appareil: "Téléphone de terrain",
            adresse: null,
            creeLe: new Date("2024-03-03T10:00:00Z"),
            expireLe: new Date("2024-03-10T10:00:00Z"),
          },
        ]}
      />,
    );
    expect(screen.getByText("2 sessions actives, cet appareil compris.")).toBeInTheDocument();
    expect(screen.getByText("Cet appareil")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Déconnecter les autres" }),
    ).toBeInTheDocument();
  });

  it("masque la carte sessions quand elles ne sont pas chargées", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
      />,
    );
    expect(screen.queryByText("Sessions en cours")).not.toBeInTheDocument();
  });

  it("ouvre la correction des coordonnées au crayon quand elle est autorisée", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        peutModifierCoordonnees
        formulaireCoordonnees={
          <FormulaireMonProfil nomInitial="Chef Distributeur" telephoneInitial="" />
        }
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Corriger : Coordonnées" }));
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeInTheDocument();
  });

  it("verrouille le crayon avec son motif quand la correction est indisponible", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        peutModifierCoordonnees={false}
        motifCoordonneesVerrouillees="Lecture seule : compte suspendu."
        formulaireCoordonnees={null}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Coordonnées : non modifiable" }),
    ).toBeInTheDocument();
  });

  it("propose d'activer le second facteur quand il est à activer", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        secondFacteurActif={false}
        formulaireSecondFacteur={<ActivationSecondFacteur />}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Activer le second facteur" }));
    expect(screen.getByLabelText("Confirmez votre mot de passe")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nom de l'appareil")).not.toBeInTheDocument();
  });

  it("propose le code par email comme méthode alternative", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        secondFacteurActif={false}
        formulaireSecondFacteur={<ActivationSecondFacteur />}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Activer le second facteur" }));
    const optionEmail = screen.getByRole("button", { name: /Email/ });
    expect(optionEmail).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(optionEmail);
    expect(optionEmail).toHaveAttribute("aria-pressed", "true");
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
