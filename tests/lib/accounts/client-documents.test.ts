import { describe, expect, it } from "vitest";
import {
  TAILLE_MAX_IMAGE_OCTETS,
  TAILLE_MAX_PDF_OCTETS,
  etatPieceDeposable,
  typePieceValide,
  verdictFichierPiece,
} from "@/lib/accounts/document-files";
import { lignesEcrites } from "@/lib/accounts/mysql-result";

describe("verdictFichierPiece", () => {
  it("accepte une image JPEG conforme", () => {
    const verdict = verdictFichierPiece({
      nom: "cni.jpg",
      mime: "image/jpeg",
      tailleOctets: 500_000,
    });
    expect(verdict).toEqual({ ok: true, extension: "jpg" });
  });

  it("accepte un PDF conforme", () => {
    const verdict = verdictFichierPiece({
      nom: "passeport.pdf",
      mime: "application/pdf",
      tailleOctets: 4 * 1024 * 1024,
    });
    expect(verdict).toEqual({ ok: true, extension: "pdf" });
  });

  it("refuse les types inconnus", () => {
    const verdict = verdictFichierPiece({
      nom: "piece.exe",
      mime: "application/x-msdownload",
      tailleOctets: 1000,
    });
    expect(verdict.ok).toBe(false);
  });

  it("refuse l'extension qui ne correspond pas au contenu", () => {
    const verdict = verdictFichierPiece({
      nom: "virus.pdf",
      mime: "image/jpeg",
      tailleOctets: 1000,
    });
    expect(verdict.ok).toBe(false);
  });

  it("refuse le PDF trop lourd et l'image trop lourde", () => {
    expect(
      verdictFichierPiece({
        nom: "gros.pdf",
        mime: "application/pdf",
        tailleOctets: TAILLE_MAX_PDF_OCTETS + 1,
      }).ok,
    ).toBe(false);
    expect(
      verdictFichierPiece({
        nom: "grosse.jpg",
        mime: "image/jpeg",
        tailleOctets: TAILLE_MAX_IMAGE_OCTETS + 1,
      }).ok,
    ).toBe(false);
  });

  it("refuse le fichier vide", () => {
    expect(
      verdictFichierPiece({ nom: "vide.jpg", mime: "image/jpeg", tailleOctets: 0 })
        .ok,
    ).toBe(false);
  });
});

describe("typePieceValide", () => {
  it("connaît CNI, PASSEPORT, PERMIS, AUTRE — rien d'autre", () => {
    for (const type of ["CNI", "PASSEPORT", "PERMIS", "AUTRE"]) {
      expect(typePieceValide(type)).toBe(true);
    }
    expect(typePieceValide("CARTE_SEJOUR")).toBe(false);
    expect(typePieceValide("")).toBe(false);
  });
});

describe("etatPieceDeposable", () => {
  it("laisse déposer en attente, refusé, ou validé qui remplace sa pièce", () => {
    expect(etatPieceDeposable("EN_ATTENTE_VALIDATION")).toBe(true);
    expect(etatPieceDeposable("REFUSE")).toBe(true);
    expect(etatPieceDeposable("VALIDE")).toBe(true);
  });

  it("refuse le dépôt à un compte révoqué ou d'état inconnu", () => {
    expect(etatPieceDeposable("REVOQUE")).toBe(false);
    expect(etatPieceDeposable("SUSPENDU")).toBe(false);
    expect(etatPieceDeposable("")).toBe(false);
  });
});

describe("lignesEcrites", () => {
  const enteteReel = (affectedRows: number) => [
    { fieldCount: 0, affectedRows, insertId: 0, changedRows: affectedRows },
    null,
  ];

  it("lit le nombre de lignes dans la forme renvoyée par mysql2", () => {
    expect(lignesEcrites(enteteReel(1))).toBe(1);
    expect(lignesEcrites(enteteReel(0))).toBe(0);
  });

  it("ne confond jamais une écriture réussie avec un refus", () => {
    expect(lignesEcrites(enteteReel(1))).not.toBe(0);
  });

  it("tolère aussi la forme objet, pour un pilote qui la rendrait", () => {
    expect(lignesEcrites({ affectedRows: 3 })).toBe(3);
  });

  it("renvoie 0 sur une forme inconnue plutôt que de mentir", () => {
    expect(lignesEcrites(undefined)).toBe(0);
    expect(lignesEcrites(null)).toBe(0);
    expect(lignesEcrites({})).toBe(0);
  });
});
