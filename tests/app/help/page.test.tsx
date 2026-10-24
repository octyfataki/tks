import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AideContenu } from "@/components/help/help-content";
import {
  AIDE_PARCOURS,
  AIDE_ROLES,
  destinationAide,
  parcoursDuNiveau,
  type AideNiveau,
} from "@/lib/help-content";
import type { Profil } from "@/lib/accounts/session-role";

const ROUTES_EXISTANTES = new Set([
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/verify-2fa",
  "/pending",
  "/clients",
  "/clients/pricing",
  "/clients/profile",
  "/clients/settings",
  "/clients/help",
  "/agent/dashboard",
  "/agent/clients",
  "/agent/clients/validation",
  "/agent/treasury",
  "/agent/profile",
  "/agent/settings",
  "/agent/help",
  "/admin/dashboard",
  "/admin/clients",
  "/admin/clients/new",
  "/admin/clients/validation",
  "/admin/agents",
  "/admin/agents/create",
  "/admin/agents/invitations",
  "/admin/agents/permissions",
  "/admin/invites",
  "/admin/create",
  "/admin/list",
  "/admin/pricing",
  "/admin/treasury",
  "/admin/settings",
  "/admin/profile",
  "/admin/audit-log",
  "/admin/notifications",
  "/admin/help",
  "/help",
]);

function chemin(href: string) {
  return href.split("?")[0] ?? href;
}

function articleDuParcours(titre: string) {
  const heading = screen.getByRole("heading", { level: 3, name: titre });
  const article = heading.closest("article");
  expect(article, `le parcours « ${titre} » doit être un article`).not.toBeNull();
  return article as HTMLElement;
}

describe("page d'aide", () => {
  it("affiche un seul h1, propre au niveau demandé", () => {
    for (const niveau of ["Client", "Agent", "Admin"] as AideNiveau[]) {
      const { unmount } = render(<AideContenu niveau={niveau} />);
      const titres = screen.getAllByRole("heading", { level: 1 });
      expect(titres).toHaveLength(1);
      expect(titres[0]).toHaveTextContent(AIDE_ROLES[niveau].titre);
      unmount();
    }
  });

  it("ne montre jamais les parcours d'un autre niveau", () => {
    for (const niveau of ["Client", "Agent", "Admin"] as AideNiveau[]) {
      const { unmount } = render(<AideContenu niveau={niveau} />);
      const visibles = new Set(
        parcoursDuNiveau(niveau).map((parcours) => parcours.id),
      );
      for (const parcours of AIDE_PARCOURS) {
        if (visibles.has(parcours.id)) continue;
        expect(
          document.querySelector(`[data-parcours="${parcours.id}"]`),
          `« ${parcours.titre} » (${parcours.niveau}) ne doit pas apparaître dans l'aide ${niveau}`,
        ).toBeNull();
      }
      unmount();
    }
  });

  it("chaque parcours ouvert pointe vers une page qui existe", () => {
    for (const niveau of ["Client", "Agent", "Admin"] as AideNiveau[]) {
      const { unmount } = render(<AideContenu niveau={niveau} />);
      for (const parcours of parcoursDuNiveau(niveau)) {
        if (parcours.bientot) continue;
        const article = articleDuParcours(parcours.titre);
        fireEvent.click(
          within(article).getByRole("button", { name: /Afficher les détails/ }),
        );
        if (!parcours.lien) {
          expect(
            within(article).queryByRole("link"),
            `« ${parcours.titre} » n'a pas de lien`,
          ).toBeNull();
          continue;
        }
        expect(
          ROUTES_EXISTANTES.has(chemin(parcours.lien.href)),
          `${parcours.titre} pointe vers ${parcours.lien.href}, qui doit exister`,
        ).toBe(true);
        const lien = within(article).getByRole("link", {
          name: new RegExp(parcours.lien.libelle, "i"),
        });
        expect(lien).toHaveAttribute("href", parcours.lien.href);
      }
      unmount();
    }
  });

  it("marque les parcours à venir sans lien mort", () => {
    for (const niveau of ["Client", "Agent", "Admin"] as AideNiveau[]) {
      const { unmount } = render(<AideContenu niveau={niveau} />);
      const aVenir = parcoursDuNiveau(niveau).filter(
        (parcours) => parcours.bientot,
      );
      expect(aVenir.length).toBeGreaterThan(0);
      for (const parcours of aVenir) {
        const article = articleDuParcours(parcours.titre);
        expect(within(article).getByText("Bientôt")).toBeInTheDocument();
        expect(within(article).queryByRole("link")).toBeNull();
      }
      unmount();
    }
  });

  it("affiche la section Bientôt même pour le client", () => {
    render(<AideContenu niveau="Client" />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Bientôt dans l’application",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Commander de l’airtime" }),
    ).toBeInTheDocument();
  });

  it("filtre les parcours et les repères par la recherche", () => {
    render(<AideContenu niveau="Admin" />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "caisse" },
    });
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Tenir la caisse et le mobile money",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Valider un compte client" }),
    ).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(/pour « caisse »/i);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "introuvable-xyz" },
    });
    expect(screen.getByText(/Rien ici pour/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tout réafficher/i }));
    expect(
      screen.getByRole("heading", { level: 3, name: "Valider un compte client" }),
    ).toBeInTheDocument();
  });

  it("filtre par statut : ouverts, bientôt, repères", () => {
    render(<AideContenu niveau="Admin" />);

    const declencheur = screen.getByRole("button", { name: "Filtrer l’aide" });
    fireEvent.click(declencheur);
    fireEvent.click(screen.getByRole("menuitem", { name: "Bientôt" }));
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Bientôt dans l’application",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Accès" }),
    ).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(/parcours à venir/i);

    fireEvent.click(declencheur);
    fireEvent.click(screen.getByRole("menuitem", { name: "Repères" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Repères" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "Bientôt dans l’application",
      }),
    ).toBeNull();

    fireEvent.click(declencheur);
    fireEvent.click(screen.getByRole("menuitem", { name: "Parcours ouverts" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Accès" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Repères" }),
    ).toBeNull();
  });

  it("cite l'exemple monétaire normatif tel quel", () => {
    render(<AideContenu niveau="Client" />);
    expect(
      screen.getAllByText(/reste à payer : 65 000 cdf/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("décrit la connexion par email et la preuve remplaçable", () => {
    const client = render(<AideContenu niveau="Client" />);
    screen
      .getAllByRole("button", { name: /Afficher les détails/ })
      .forEach((bouton) => fireEvent.click(bouton));
    expect(
      screen.getByText(/Entrez l’adresse email du compte et votre mot de passe/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/peut être remplacée sans recréer la commande/i),
    ).toBeInTheDocument();
    client.unmount();

    render(<AideContenu niveau="Agent" />);
    screen
      .getAllByRole("button", { name: /Afficher les détails/ })
      .forEach((bouton) => fireEvent.click(bouton));
    expect(
      screen.getByText(/l’ancienne reste conservée et consultable/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/la créance à l’origine du paiement est facultative/i),
    ).toBeInTheDocument();
  });

  it("ne désigne jamais par un terme interdit : chaque occurrence est niée", () => {
    render(<AideContenu niveau="Admin" />);
    const texte = (document.body.textContent ?? "").toLowerCase();
    for (const interdit of ["shop", "réalisation", "e-money", "virtuel", "facture"]) {
      let index = texte.indexOf(interdit);
      expect(index, `« ${interdit} » mentionné puis nié`).toBeGreaterThanOrEqual(0);
      while (index >= 0) {
        const contexte = texte.slice(
          Math.max(0, index - 40),
          index + interdit.length + 140,
        );
        expect(
          contexte,
          `« ${interdit} » doit être nié, contexte : ${contexte}`,
        ).toMatch(/jamais|n'existent pas|n’existent pas/);
        index = texte.indexOf(interdit, index + 1);
      }
    }
  });
});

describe("aiguillage de l'aide", () => {
  it("chaque destination renvoie vers une page qui existe", () => {
    const profils: Profil[] = [
      { type: "ANONYME" },
      { type: "CLIENT", etat: "VALIDE" },
      { type: "CLIENT", etat: "EN_ATTENTE_VALIDATION" },
      { type: "CLIENT", etat: "REFUSE" },
      { type: "CLIENT", etat: "REVOQUE" },
      { type: "STAFF", role: "AGENT", etat: "VALIDE" },
      { type: "STAFF", role: "AGENT", etat: "SUSPENDU" },
      { type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" },
      { type: "STAFF", role: "ADMIN_TECHNIQUE", etat: "VALIDE" },
      { type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "REVOQUE" },
    ];

    for (const profil of profils) {
      const destination = destinationAide(profil);
      expect(
        ROUTES_EXISTANTES.has(destination),
        `destinationAide(${profil.type}) renvoie ${destination}, qui doit exister`,
      ).toBe(true);
    }
  });

  it("ramène un client non validé vers l’attente, un révoqué vers la connexion", () => {
    expect(
      destinationAide({ type: "CLIENT", etat: "EN_ATTENTE_VALIDATION" }),
    ).toBe("/pending");
    expect(destinationAide({ type: "CLIENT", etat: "REFUSE" })).toBe("/pending");
    expect(destinationAide({ type: "CLIENT", etat: "REVOQUE" })).toBe(
      "/sign-in",
    );
    expect(
      destinationAide({
        type: "STAFF",
        role: "AGENT",
        etat: "SUSPENDU",
      }),
    ).toBe("/sign-in");
  });
});
