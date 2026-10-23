import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ProfilUtilisateur } from "@/components/profile/user-profile";
import { FormulaireMonProfil } from "@/app/admin/profile/my-profile-form";
import { FormulaireMotDePasse } from "@/components/profile/change-password-form";
import { ActivationSecondFacteur } from "@/components/profile/two-factor-activation";

vi.mock("@/app/admin/profile/actions", () => ({
  modifierPhotoProfilAction: vi.fn(),
  supprimerPhotoProfilAction: vi.fn(),
  deconnecterAutresSessionsAction: vi.fn(),
  modifierMonProfilAction: vi.fn(),
  changerMotDePasseAction: vi.fn(),
  confirmerSecondFacteurAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("ProfilUtilisateur", () => {
  it("affiche le compte client sans profil client avec l'état vide normatif", () => {
    render(
      <ProfilUtilisateur
        nom="Aline Mukendi"
        email="aline@example.com"
        compte={{ type: "CLIENT" }}
        profilClient={null}
      />,
    );
    expect(screen.getByRole("heading", { name: "Aline Mukendi" })).toBeInTheDocument();
    expect(
      screen.getByText(/aucun profil client rattaché/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Dossier client")).not.toBeInTheDocument();
  });

  it("affiche le profil client rattaché quand le compte y est rattaché", () => {
    render(
      <ProfilUtilisateur
        nom="Aline Mukendi"
        email="aline@example.com"
        telephone="+243 810 000 001"
        compte={{ type: "CLIENT" }}
        profilClient={{
          nom: "Boutique Mukendi",
          statut: "PRIVILEGIE",
          adresse: "Kinshasa",
        }}
      />,
    );
    expect(screen.getByText("Boutique Mukendi")).toBeInTheDocument();
    expect(screen.getByText("Privilégié")).toBeInTheDocument();
  });

  it("affiche la mission de terrain pour un agent et aucune carte d'administration", () => {
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
    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
  });

  it("distingue second facteur jamais activé et actif", () => {
    const { rerender } = render(
      <ProfilUtilisateur
        nom="Chef"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
      />,
    );
    expect(screen.getAllByText("Non activé").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Non vérifié")).not.toBeInTheDocument();

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

  it("n'affiche chaque donnée qu'une seule fois", () => {
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
    expect(screen.getAllByText(/Matricule ABCDEF12/i)).toHaveLength(1);
    expect(screen.getAllByText("+243 810 000 002")).toHaveLength(1);
    expect(screen.getAllByText(/chef@example\.com/)).toHaveLength(1);
    expect(screen.getAllByText(/Compte créé le/)).toHaveLength(1);
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
            appareil:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            adresse: "192.0.2.10",
            creeLe: new Date("2024-03-02T10:00:00Z"),
            expireLe: new Date("2024-03-09T10:00:00Z"),
          },
          {
            id: "session-ailleurs",
            appareil: "node",
            adresse: "::1",
            creeLe: new Date("2024-03-03T10:00:00Z"),
            expireLe: new Date("2024-03-10T10:00:00Z"),
          },
        ]}
      />,
    );
    expect(screen.getByText("2 sessions actives, cet appareil compris.")).toBeInTheDocument();
    expect(screen.getByText("Cet appareil")).toBeInTheDocument();
    expect(screen.getByText("Chrome sur Windows 10")).toBeInTheDocument();
    expect(screen.getByText("Session serveur (Node)")).toBeInTheDocument();
    expect(screen.getByText(/127\.0\.0\.1/)).toBeInTheDocument();
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
    expect(screen.getByText("Modifiable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Corriger : Coordonnées" }));
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeInTheDocument();
  });

  it("verrouille les coordonnées avec une pastille et son motif", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_TECHNIQUE", etat: "VALIDE" }}
        peutModifierCoordonnees={false}
        motifCoordonneesVerrouillees="Lecture seule : le rôle d'administrateur technique ne permet pas de corriger vos coordonnées."
        formulaireCoordonnees={null}
      />,
    );
    const blocCoordonnees = screen.getByRole("region", { name: "Coordonnées" });
    expect(within(blocCoordonnees).getByText("Lecture seule")).toBeInTheDocument();
    expect(
      screen.getByText(/le rôle d'administrateur technique ne permet pas/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Corriger : Coordonnées" }),
    ).not.toBeInTheDocument();
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

  it("propose d'activer le second facteur à un agent de service", () => {
    render(
      <ProfilUtilisateur
        nom="Joel Agent"
        email="joel@example.com"
        telephone="+243 810 000 003"
        compte={{ type: "STAFF", role: "AGENT", etat: "VALIDE" }}
        secondFacteurActif={false}
        formulaireSecondFacteur={<ActivationSecondFacteur />}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Activer le second facteur" }));
    expect(screen.getByLabelText("Confirmez votre mot de passe")).toBeInTheDocument();
  });

  it("propose d'activer le second facteur à un client validé", () => {
    render(
      <ProfilUtilisateur
        nom="Aline Mukendi"
        email="aline@example.com"
        telephone="+243 815 000 000"
        compte={{ type: "CLIENT" }}
        profilClient={null}
        secondFacteurActif={false}
        formulaireSecondFacteur={<ActivationSecondFacteur />}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Activer le second facteur" }));
    expect(screen.getByLabelText("Confirmez votre mot de passe")).toBeInTheDocument();
  });

  it("montre les pièces d'identité au client, entre coordonnées et profil client", () => {
    render(
      <ProfilUtilisateur
        nom="Aline Mukendi"
        email="aline@example.com"
        compte={{ type: "CLIENT" }}
        profilClient={null}
        piecesIdentite={[
          {
            id: "piece-1",
            typePiece: "CNI",
            mime: "image/jpeg",
            statutPiece: "ACCEPTEE",
            refusMotif: null,
            deposeLe: new Date("2026-10-02T08:00:00Z"),
          },
        ]}
        formulairePieceIdentite={<button type="button">Remplacer ma pièce</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Pièce d'identité" })).toBeInTheDocument();
    const lien = screen.getByRole("link", { name: /pièce cni/i });
    expect(lien.getAttribute("href")).toBe("/api/client-documents/piece-1");
    expect(screen.getByText("Acceptée par le distributeur")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remplacer ma pièce/i }),
    ).toBeInTheDocument();
  });

  it("affiche l'état vide normatif quand le client n'a aucune pièce", () => {
    render(
      <ProfilUtilisateur
        nom="Aline Mukendi"
        email="aline@example.com"
        compte={{ type: "CLIENT" }}
        profilClient={null}
        piecesIdentite={[]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Pièce d'identité" })).toBeInTheDocument();
    expect(
      screen.getByText(/aucune pièce déposée pour l'instant/i),
    ).toBeInTheDocument();
  });

  it("ne montre jamais la carte pièce au personnel", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: "Pièce d'identité" }),
    ).not.toBeInTheDocument();
  });

  it("affiche l'activité récente du compte", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        activite={[
          {
            id: "e1",
            resume: "Taux saisi : 2 300 CDF pour 1 USD",
            recuLe: new Date("2026-10-02T08:00:00Z"),
          },
        ]}
        journalAccessible
      />,
    );
    expect(screen.getByRole("heading", { name: "Activité récente" })).toBeInTheDocument();
    expect(screen.getByText(/Taux saisi : 2 300 CDF pour 1 USD/)).toBeInTheDocument();
    expect(screen.getByText(/2 oct\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voir le journal d'audit" })).toBeInTheDocument();
  });

  it("n'affiche pas de lien journal à un compte qui ne le consulte pas", () => {
    render(
      <ProfilUtilisateur
        nom="Agent Terrain"
        email="agent@example.com"
        compte={{ type: "STAFF", role: "AGENT", etat: "VALIDE" }}
        activite={[
          {
            id: "e2",
            resume: "Commande servie — 50 unités",
            recuLe: new Date("2026-10-02T08:00:00Z"),
          },
        ]}
        journalAccessible={false}
      />,
    );
    expect(screen.getByRole("heading", { name: "Activité récente" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Voir le journal d'audit" })).not.toBeInTheDocument();
  });

  it("n'affiche aucun bloc d'activité quand le compte n'a rien fait", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        activite={[]}
        journalAccessible
      />,
    );
    expect(screen.queryByRole("heading", { name: "Activité récente" })).not.toBeInTheDocument();
  });

  it("affiche le formulaire de changement de mot de passe quand il est fourni", () => {
    render(
      <ProfilUtilisateur
        nom="Chef Distributeur"
        email="chef@example.com"
        compte={{ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }}
        formulaireMotDePasse={<FormulaireMotDePasse />}
      />,
    );
    expect(screen.getByLabelText("Mot de passe actuel")).toBeInTheDocument();
    expect(screen.getByLabelText("Nouveau mot de passe")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmation")).toBeInTheDocument();
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
