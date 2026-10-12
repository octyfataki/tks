import { describe, expect, it, vi } from "vitest";
import {
  etatRevoquable,
  etatTranchable,
  lireFicheClient,
  peutOuvrirFicheClient,
  pieceAValider,
  pieceARevoir,
  pieceRetirable,
  revuePiecePossible,
  statutPieceValide,
  STATUTS_PIECE,
  type IdentiteClient,
  type LecteurFicheClient,
  type PieceFicheClient,
} from "./fiche-client";

const identite: IdentiteClient = {
  id: "c1",
  nom: "Awa Kabila",
  email: "awa@example.cd",
  telephone: "+243815000000",
  etat: "EN_ATTENTE_VALIDATION",
  inscritLe: new Date("2026-10-01T08:00:00Z"),
  valideLe: null,
  refuseMotif: null,
};

const piece: PieceFicheClient = {
  id: "p1",
  typePiece: "CNI",
  mime: "image/jpeg",
  statutPiece: "EN_ATTENTE",
  refusMotif: null,
  vuePar: null,
  vueLe: null,
  deposeLe: new Date("2026-10-02T08:00:00Z"),
};

function lecteur(
  overrides: Partial<LecteurFicheClient> = {},
): LecteurFicheClient {
  return {
    lireIdentite: vi.fn(async () => identite),
    lirePieces: vi.fn(async () => [piece]),
    ...overrides,
  };
}

describe("lireFicheClient", () => {
  it("assemble l'identité du compte et ses pièces", async () => {
    const fiche = await lireFicheClient(lecteur(), "c1");
    expect(fiche).toEqual({ ...identite, pieces: [piece] });
  });

  it("renvoie null pour un identifiant inconnu, sans lire de pièces", async () => {
    const l = lecteur({ lireIdentite: vi.fn(async () => null) });
    const fiche = await lireFicheClient(l, "inconnu");
    expect(fiche).toBeNull();
    expect(l.lirePieces).not.toHaveBeenCalled();
  });
});

describe("peutOuvrirFicheClient", () => {
  it("ouvre à un administrateur VALIDE (principal ou technique)", () => {
    expect(peutOuvrirFicheClient("ADMIN_PRINCIPAL", "VALIDE", false)).toBe(true);
    expect(peutOuvrirFicheClient("ADMIN_TECHNIQUE", "VALIDE", false)).toBe(true);
  });

  it("n'ouvre jamais à un compte staff non VALIDE", () => {
    expect(peutOuvrirFicheClient("ADMIN_PRINCIPAL", "SUSPENDU", false)).toBe(
      false,
    );
    expect(peutOuvrirFicheClient("AGENT", "REVOQUE", true)).toBe(false);
  });

  it("n'ouvre à un agent que s'il tient client.valider", () => {
    expect(peutOuvrirFicheClient("AGENT", "VALIDE", true)).toBe(true);
    expect(peutOuvrirFicheClient("AGENT", "VALIDE", false)).toBe(false);
  });

  it("n'ouvre jamais à un client", () => {
    expect(peutOuvrirFicheClient("CLIENT", "VALIDE", true)).toBe(false);
  });
});

describe("décisions d'affichage de la fiche", () => {
  it("désigne la pièce la plus récente pour valider, ou null", () => {
    expect(pieceAValider({ pieces: [piece] })).toBe(piece);
    expect(pieceAValider({ pieces: [] })).toBeNull();
  });

  it("ne tranche que les comptes en attente ou refusés", () => {
    expect(etatTranchable("EN_ATTENTE_VALIDATION")).toBe(true);
    expect(etatTranchable("REFUSE")).toBe(true);
    expect(etatTranchable("VALIDE")).toBe(false);
    expect(etatTranchable("REVOQUE")).toBe(false);
  });

  it("révoque tout sauf un compte déjà révoqué", () => {
    expect(etatRevoquable("EN_ATTENTE_VALIDATION")).toBe(true);
    expect(etatRevoquable("REFUSE")).toBe(true);
    expect(etatRevoquable("VALIDE")).toBe(true);
    expect(etatRevoquable("REVOQUE")).toBe(false);
  });

  it("repère une pièce déposée après la validation du compte", () => {
    // Le verdict est porté par la pièce, plus déduit d'une date.
    expect(pieceARevoir({ statutPiece: "EN_ATTENTE" })).toBe(true);
    expect(pieceARevoir({ statutPiece: "ACCEPTEE" })).toBe(false);
    expect(pieceARevoir({ statutPiece: "REFUSEE" })).toBe(false);
  });

  it("ne statue que sur les pièces d'un compte déjà validé", () => {
    expect(
      revuePiecePossible({ etat: "VALIDE", pieces: [{ statutPiece: "EN_ATTENTE" }] }),
    ).toBe(true);
    // Compte à trancher : son chemin reste la validation de compte.
    expect(
      revuePiecePossible({
        etat: "EN_ATTENTE_VALIDATION",
        pieces: [{ statutPiece: "EN_ATTENTE" }],
      }),
    ).toBe(false);
    expect(
      revuePiecePossible({ etat: "REFUSE", pieces: [{ statutPiece: "EN_ATTENTE" }] }),
    ).toBe(false);
    // Rien à revoir : pas de boutons.
    expect(
      revuePiecePossible({ etat: "VALIDE", pieces: [{ statutPiece: "ACCEPTEE" }] }),
    ).toBe(false);
    expect(revuePiecePossible({ etat: "VALIDE", pieces: [] })).toBe(false);
  });

  it("ne statue pas sur une pièce retirée : elle n'attend plus personne", () => {
    expect(pieceARevoir({ statutPiece: "RETIREE" })).toBe(false);
    expect(
      revuePiecePossible({ etat: "VALIDE", pieces: [{ statutPiece: "RETIREE" }] }),
    ).toBe(false);
  });

  it("ne retire qu'une pièce refusée, et une seule fois", () => {
    expect(pieceRetirable({ statutPiece: "REFUSEE" })).toBe(true);
    // Une pièce en attente est hors de la portée du client : on ne retire
    // pas ce qu'un humain est en train de juger.
    expect(pieceRetirable({ statutPiece: "EN_ATTENTE" })).toBe(false);
    expect(pieceRetirable({ statutPiece: "ACCEPTEE" })).toBe(false);
    expect(pieceRetirable({ statutPiece: "RETIREE" })).toBe(false);
  });

  it("connaît les statuts de pièce — rien d'autre", () => {
    for (const statut of STATUTS_PIECE) {
      expect(statutPieceValide(statut)).toBe(true);
    }
    expect(statutPieceValide("EN_REVUE")).toBe(false);
    expect(statutPieceValide("")).toBe(false);
  });
});
