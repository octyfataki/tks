import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AideContenu } from "@/components/aide/aide-contenu";
import { AIDE_SECTIONS } from "@/lib/aide-content";

/**
 * Routes réellement servies (vérifiées dans src/app). Un raccourci ne doit
 * pointer que vers l'une d'elles : jamais de lien mort.
 */
const ROUTES_EXISTANTES = new Set([
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/verify-2fa",
  "/pending",
  "/clients",
  "/clients/profil",
  "/clients/aide",
  "/agent/dashboard",
  "/agent/profil",
  "/agent/aide",
  "/admin/dashboard",
  "/admin/invites",
  "/admin/notifications",
  "/admin/list",
  "/admin/profil",
  "/admin/aide",
  "/aide",
]);

describe("page d'aide", () => {
  it("affiche un h1 unique et une rubrique par niveau (client, agent, admin)", () => {
    render(<AideContenu />);
    expect(
      screen.getByRole("heading", { level: 1, name: /trouvez le raccourci/i }),
    ).toBeInTheDocument();
    for (const section of AIDE_SECTIONS) {
      expect(
        screen.getByRole("heading", { level: 2, name: `Aide ${section.niveau}` }),
      ).toBeInTheDocument();
    }
  });

  it("verrouillée sur un niveau, ne montre que sa rubrique", () => {
    render(<AideContenu niveau="Agent" />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Aide Agent" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Aide Client" })).toBeNull();
    expect(screen.queryByRole("heading", { level: 2, name: "Aide Admin" })).toBeNull();
  });

  it("chaque carte liée pointe vers une page qui existe, sinon Bientôt", () => {
    render(<AideContenu />);
    for (const section of AIDE_SECTIONS) {
      const titre = screen.getByRole("heading", {
        level: 2,
        name: `Aide ${section.niveau}`,
      });
      const rubrique = titre.closest("section");
      expect(rubrique).not.toBeNull();
      const zone = within(rubrique as HTMLElement);
      for (const raccourci of section.raccourcis) {
        if (raccourci.href) {
          expect(
            ROUTES_EXISTANTES.has(raccourci.href),
            `${raccourci.label} pointe vers ${raccourci.href}, qui doit exister`,
          ).toBe(true);
          const carte = (rubrique as HTMLElement).querySelector(
            `a[href="${raccourci.href}"]`,
          );
          expect(carte, `${raccourci.label} doit être une carte cliquable`).not.toBeNull();
          expect(carte?.textContent).toMatch(raccourci.label);
          expect(zone.getByText(raccourci.description)).toBeInTheDocument();
        } else {
          const carte = zone.getByText(raccourci.label).closest("div[data-slot='card']");
          expect(carte?.textContent).toMatch(/bientôt/i);
          expect(carte?.tagName.toLowerCase()).not.toBe("a");
        }
      }
    }
  });

  it("cite l'exemple monétaire normatif tel quel", () => {
    render(<AideContenu />);
    expect(
      screen.getAllByText(/reste à payer : 65 000 cdf/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("ne désigne jamais par un terme interdit : chaque occurrence est niée", () => {
    render(<AideContenu />);
    const texte = (document.body.textContent ?? "").toLowerCase();
    for (const interdit of ["shop", "réalisation", "e-money", "virtuel"]) {
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
