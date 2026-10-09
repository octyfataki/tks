// Règles pures des fichiers de pièce d'identité (S1-03) : ni base, ni
// framework — testées sans environnement. Le contrôle réel est serveur
// (pieces-clients.ts) ; le client ne fait que pré-filtrer.

export const TYPES_PIECE = ["CNI", "PASSEPORT", "PERMIS", "AUTRE"] as const;
export type TypePiece = (typeof TYPES_PIECE)[number];

/** PDF accepté en l'état. */
export const MIME_PDF = "application/pdf";

/** Plafonds serveur : image 3 Mo, PDF 5 Mo. */
export const TAILLE_MAX_IMAGE_OCTETS = 3 * 1024 * 1024;
export const TAILLE_MAX_PDF_OCTETS = 5 * 1024 * 1024;

const EXTENSION_PAR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function typePieceValide(valeur: string): valeur is TypePiece {
  return (TYPES_PIECE as readonly string[]).includes(valeur);
}

/**
 * Verdict pur sur un fichier candidat : extension, type et taille.
 */
export function verdictFichierPiece(input: {
  nom: string;
  mime: string;
  tailleOctets: number;
}): { ok: true; extension: string } | { ok: false; erreur: string } {
  const extension = EXTENSION_PAR_MIME[input.mime];
  if (!extension) {
    return {
      ok: false,
      erreur: "Fichier refusé : image (JPEG, PNG, WebP) ou PDF uniquement.",
    };
  }
  const extensionNom = input.nom.split(".").pop()?.toLowerCase() ?? "";
  const attendues =
    input.mime === MIME_PDF
      ? ["pdf"]
      : input.mime === "image/jpeg"
        ? ["jpg", "jpeg"]
        : input.mime === "image/png"
          ? ["png"]
          : ["webp"];
  if (!attendues.includes(extensionNom)) {
    return {
      ok: false,
      erreur: "L'extension du fichier ne correspond pas à son contenu.",
    };
  }
  const plafond =
    input.mime === MIME_PDF ? TAILLE_MAX_PDF_OCTETS : TAILLE_MAX_IMAGE_OCTETS;
  if (!Number.isFinite(input.tailleOctets) || input.tailleOctets <= 0) {
    return { ok: false, erreur: "Fichier vide ou illisible." };
  }
  if (input.tailleOctets > plafond) {
    return {
      ok: false,
      erreur:
        input.mime === MIME_PDF
          ? "PDF trop lourd (5 Mo au plus)."
          : "Image trop lourde (3 Mo au plus).",
    };
  }
  return { ok: true, extension };
}
