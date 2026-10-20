"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderError } from "./order-record";
import { cancelOrder, lockOrder, serveOrder } from "./transitions";

const RETOURS = ["/agent/orders", "/admin/orders"] as const;

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

export async function takeOrderAction(donnees: FormData): Promise<void> {
  const orderId = champ(donnees, "orderId");
  const retour = cible(donnees, "/agent/orders");
  let erreur: string | null = null;
  try {
    await lockOrder(orderId);
  } catch (cause) {
    erreur = message(cause);
  }
  revalidatePath(retour, "layout");
  redirect(
    erreur
      ? `${retour}?erreur=${encodeURIComponent(erreur)}`
      : `${retour}?ok=order-taken`,
  );
}

export async function serveOrderAction(donnees: FormData): Promise<void> {
  const orderId = champ(donnees, "orderId");
  const retour = cible(donnees, "/agent/orders");
  let erreur: string | null = null;
  try {
    await serveOrder(orderId);
  } catch (cause) {
    erreur = message(cause);
  }
  revalidatePath(retour, "layout");
  redirect(
    erreur
      ? `${retour}?erreur=${encodeURIComponent(erreur)}`
      : `${retour}?ok=order-served`,
  );
}

export async function cancelOrderAction(donnees: FormData): Promise<void> {
  const orderId = champ(donnees, "orderId");
  const motif = champ(donnees, "reason");
  const retour = cible(donnees, "/agent/orders");
  let erreur: string | null = null;
  try {
    await cancelOrder(orderId, motif);
  } catch (cause) {
    erreur = message(cause);
  }
  revalidatePath(retour, "layout");
  redirect(
    erreur
      ? `${retour}?erreur=${encodeURIComponent(erreur)}`
      : `${retour}?ok=order-cancelled`,
  );
}
