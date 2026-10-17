import { describe, expect, it } from "vitest";
import { autoriseLecturePiece, type LecteurPiece } from "./acces-piece-identite";

const PIECE = "compte-de-la-piece";

function client(compteClientId: string): LecteurPiece {
  return { type: "CLIENT", compteClientId };
}

function agent(etat: string, peutValider: boolean): LecteurPiece {
  return { type: "STAFF", role: "AGENT", etat, peutValider };
}

function admin(role: "ADMIN_PRINCIPAL" | "ADMIN_TECHNIQUE", etat: string): LecteurPiece {
  return { type: "STAFF", role, etat, peutValider: false };
}

describe("S1 — lecture d'une pièce d'identité", () => {
  it("refuse l'anonyme avec un 401", () => {
    expect(autoriseLecturePiece({ type: "ANONYME" }, PIECE)).toEqual({
      autorise: false,
      statut: 401,
      erreur: "Non connecté.",
    });
  });

  it("laisse un client lire la sienne", () => {
    expect(autoriseLecturePiece(client(PIECE), PIECE)).toEqual({ autorise: true });
  });

  it("refuse à un client la pièce d'un autre", () => {
    expect(autoriseLecturePiece(client("autre-compte"), PIECE)).toEqual({
      autorise: false,
      statut: 403,
      erreur: "Accès refusé.",
    });
  });

  it("laisse les deux administrateurs valides, même sans permission de valider", () => {
    expect(autoriseLecturePiece(admin("ADMIN_PRINCIPAL", "VALIDE"), PIECE)).toEqual({
      autorise: true,
    });
    expect(autoriseLecturePiece(admin("ADMIN_TECHNIQUE", "VALIDE"), PIECE)).toEqual({
      autorise: true,
    });
  });

  it("refuse un administrateur suspendu ou révoqué", () => {
    for (const etat of ["SUSPENDU", "REVOQUE"]) {
      expect(autoriseLecturePiece(admin("ADMIN_PRINCIPAL", etat), PIECE)).toEqual({
        autorise: false,
        statut: 403,
        erreur: "Accès refusé.",
      });
    }
  });

  it("n'accorde à un agent que ce qu'il a explicitement", () => {
    expect(autoriseLecturePiece(agent("VALIDE", false), PIECE)).toEqual({
      autorise: false,
      statut: 403,
      erreur: "Accès refusé.",
    });
    expect(autoriseLecturePiece(agent("VALIDE", true), PIECE)).toEqual({
      autorise: true,
    });
  });

  it("refuse un agent suspendu même avec la permission", () => {
    expect(autoriseLecturePiece(agent("SUSPENDU", true), PIECE)).toEqual({
      autorise: false,
      statut: 403,
      erreur: "Accès refusé.",
    });
  });
});