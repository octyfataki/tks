import { describe, expect, it } from "vitest";
import {
  TAILLE_MAX_IMAGE_OCTETS,
  TAILLE_MAX_PDF_OCTETS,
  typePieceValide,
  verdictFichierPiece,
} from "./pieces-fichiers";

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
