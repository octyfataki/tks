"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderError } from "@/modules/orders/order-record";
import { refuseProof, validateProof } from "./review";

const RETOURS = ["/agent/proofs", "/admin/proofs"] as const;

function champ(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function cible(donnees: FormData, defaut: string): string {
  const demande = champ(donnees, "retour");
  const connue = RETOURS.find((chemin) => chemin === demande);
  return connue ?? defaut;
}

function message(erreur: unknown): string {
  if (erreur instanceof OrderError) return erreur.message;
  if (erreur instanceof Error) return erreur.message;
  return "Opération impossible.";
}

export async function validateProofAction(donnees: FormData): Promise<void> {
  const proofId = champ(donnees, "proofId");
  const retour = cible(donnees, "/agent/proofs");
  let erreur: string | null = null;
  try {
    await validateProof(proofId);
  } catch (cause) {
    erreur = message(cause);
  }
  revalidatePath(retour, "layout");
  revalidatePath("/agent/orders", "layout");
  revalidatePath("/admin/orders", "layout");
  redirect(
    erreur
      ? `${retour}?erreur=${encodeURIComponent(erreur)}`
      : `${retour}?ok=proof-validated`,
  );
}

export async function refuseProofAction(donnees: FormData): Promise<void> {
  const proofId = champ(donnees, "proofId");
  const motif = champ(donnees, "reason");
  const retour = cible(donnees, "/agent/proofs");
  let erreur: string | null = null;
  try {
    await refuseProof(proofId, motif);
  } catch (cause) {
    erreur = message(cause);
  }
  revalidatePath(retour, "layout");
  revalidatePath("/agent/orders", "layout");
  revalidatePath("/admin/orders", "layout");
  redirect(
    erreur
      ? `${retour}?erreur=${encodeURIComponent(erreur)}`
      : `${retour}?ok=proof-refused`,
  );
}
