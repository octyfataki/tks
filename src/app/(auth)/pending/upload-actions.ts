"use server";

import { revalidatePath } from "next/cache";
import {
  compteClientConnecte,
  deposerPieceIdentiteClient,
  PieceError,
} from "@/lib/accounts/client-documents";
import { typePieceValide } from "@/lib/accounts/document-files";
import type { ResultatAction } from "@/lib/action-result";

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
    revalidatePath("/admin/clients/validation");
    revalidatePath("/admin/clients");
    revalidatePath("/clients/profil");
    return { ok: true, pieceId: deposee.id };
  } catch (erreur) {
    if (erreur instanceof PieceError) {
      return { ok: false, erreur: messageErreur(erreur.code, erreur.message) };
    }
    return { ok: false, erreur: "Dépôt impossible pour le moment, réessayez." };
  }
}
