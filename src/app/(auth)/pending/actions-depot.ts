"use server";

import { revalidatePath } from "next/cache";
import {
  compteClientConnecte,
  deposerPieceIdentiteClient,
  PieceError,
} from "@/lib/s1-comptes/pieces-clients";
import { typePieceValide } from "@/lib/s1-comptes/pieces-fichiers";
import type { ResultatAction } from "@/lib/resultat-action";

export type ResultatDepotPiece = ResultatAction<{ pieceId: string }>;

function messageErreur(code: PieceError["code"], detail: string): string {
  switch (code) {
    case "NON_AUTORISE":
      return "Connectez-vous avec votre compte client pour déposer.";
    case "COMPTE_NON_ELIGIBLE":
      return "Ce compte n'a plus de pièce à déposer.";
    case "TYPE_PIECE_INVALIDE":
      return "Type de pièce inconnu.";
    case "FICHIER_REFUSE":
      return detail;
    case "STOCKAGE_INDISPONIBLE":
      return "Dépôt impossible pour le moment, réessayez.";
  }
}

/**
 * Dépose la pièce d'identité du client connecté (image ou PDF). Le compte
 * doit être EN_ATTENTE_VALIDATION ou REFUSE : un compte déjà validé n'a
 * plus rien à déposer, et un compte révoqué ne dépose plus rien.
 */
export async function deposerPieceIdentiteAction(
  _precedent: ResultatDepotPiece | null,
  donnees: FormData,
): Promise<ResultatDepotPiece> {
  const compte = await compteClientConnecte();
  if (!compte) {
    return {
      ok: false,
      erreur: "Connectez-vous avec votre compte client pour déposer.",
    };
  }
  const typePiece = String(donnees.get("typePiece") ?? "").trim();
  if (!typePieceValide(typePiece)) {
    return { ok: false, erreur: "Type de pièce inconnu." };
  }
  const fichier = donnees.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { ok: false, erreur: "Choisissez un fichier image ou PDF." };
  }
  try {
    const octets = new Uint8Array(await fichier.arrayBuffer());
    const deposee = await deposerPieceIdentiteClient({
      compteClientId: compte.id,
      typePiece,
      nomFichier: fichier.name,
      mime: fichier.type,
      octets,
    });
    revalidatePath("/pending");
    // Le dépôt alimente la file du distributeur : sans ces deux
    // revalidations, /admin/clients/validation garderait la ligne « sans
    // pièce » jusqu'au rechargement manuel.
    revalidatePath("/admin/clients/validation");
    revalidatePath("/admin/clients");
    return { ok: true, pieceId: deposee.id };
  } catch (erreur) {
    if (erreur instanceof PieceError) {
      return { ok: false, erreur: messageErreur(erreur.code, erreur.message) };
    }
    return { ok: false, erreur: "Dépôt impossible pour le moment, réessayez." };
  }
}
