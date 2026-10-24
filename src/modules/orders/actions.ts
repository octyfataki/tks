"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderError } from "./order-record";
import { createOrder } from "./create";
import { cancelOrder, lockOrder, serveOrder } from "./transitions";
import {
  ensureCounterProfile,
  type ProfileSummary,
} from "@/modules/profiles/find";
import { ProfileError } from "@/modules/profiles/profile-record";

const RETOURS = ["/agent/orders", "/admin/orders"] as const;

const CAISSES = ["/agent/orders/new", "/admin/orders/new"] as const;

function champ(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function cible(donnees: FormData, defaut: string): string {
  const demande = champ(donnees, "retour");
  const connue = RETOURS.find((chemin) => chemin === demande);
  return connue ?? defaut;
}

function cibleCaisse(donnees: FormData, defaut: string): string {
  const demande = champ(donnees, "retour");
  const connue = CAISSES.find((chemin) => chemin === demande);
  return connue ?? defaut;
}

function message(erreur: unknown): string {
  if (erreur instanceof OrderError) return erreur.message;
  if (erreur instanceof ProfileError) return erreur.message;
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

export async function createCounterOrderAction(
  donnees: FormData,
): Promise<void> {
  const profileId = champ(donnees, "profileId");
  const retour = cibleCaisse(donnees, "/agent/orders/new");
  const file = retour.replace(/\/new$/, "");
  let erreur: string | null = null;
  let orderId: string | null = null;
  try {
    const created = await createOrder({
      profileId,
      network: champ(donnees, "network"),
      channel: "COUNTER",
      type: champ(donnees, "type"),
      units: champ(donnees, "units") || undefined,
      amount: champ(donnees, "amount") || undefined,
    });
    orderId = created.id;
  } catch (cause) {
    erreur = message(cause);
  }
  revalidatePath("/agent/orders", "layout");
  revalidatePath("/admin/orders", "layout");
  redirect(
    erreur
      ? `${retour}?profileId=${encodeURIComponent(profileId)}&erreur=${encodeURIComponent(erreur)}`
      : `${file}?ok=${encodeURIComponent(`Commande créée (${orderId?.slice(0, 8)}).`)}`,
  );
}

export async function createCounterProfileAction(
  donnees: FormData,
): Promise<void> {
  const nom = champ(donnees, "name");
  const telephone = champ(donnees, "phone");
  const adresse = champ(donnees, "address");
  const retour = cibleCaisse(donnees, "/agent/orders/new");
  let erreur: string | null = null;
  let profile: ProfileSummary | null = null;
  try {
    profile = await ensureCounterProfile({
      name: nom,
      phone: telephone,
      address: adresse,
    });
  } catch (cause) {
    erreur = message(cause);
  }
  redirect(
    erreur
      ? `${retour}?contact=${encodeURIComponent(telephone)}&nom=${encodeURIComponent(nom)}&erreur=${encodeURIComponent(erreur)}`
      : `${retour}?profileId=${encodeURIComponent(profile?.id ?? "")}`,
  );
}
