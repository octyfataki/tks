"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderError } from "@/modules/orders/order-record";
import { createOrder } from "@/modules/orders/create";
import { ensureCounterProfile } from "@/modules/profiles/find";
import { ProfileError } from "@/modules/profiles/profile-record";

function champ(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function message(erreur: unknown): string {
  if (erreur instanceof OrderError || erreur instanceof ProfileError) {
    return erreur.message;
  }
  if (erreur instanceof Error) return erreur.message;
  return "Opération impossible.";
}

export async function createCounterOrderAction(
  donnees: FormData,
): Promise<void> {
  const profileId = champ(donnees, "profileId");
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
  const retour = `/agent/orders/new?profileId=${encodeURIComponent(profileId)}`;
  redirect(
    erreur
      ? `${retour}&erreur=${encodeURIComponent(erreur)}`
      : `/agent/orders?ok=${encodeURIComponent(`Commande créée (${orderId?.slice(0, 8)}).`)}`,
  );
}

export async function createCounterProfileAction(
  donnees: FormData,
): Promise<void> {
  const nom = champ(donnees, "name");
  const telephone = champ(donnees, "phone");
  const adresse = champ(donnees, "address");
  let erreur: string | null = null;
  let profileId: string | null = null;
  try {
    const profile = await ensureCounterProfile({
      name: nom,
      phone: telephone,
      address: adresse,
    });
    profileId = profile.id;
  } catch (cause) {
    erreur = message(cause);
  }
  const retour = `/agent/orders/new?contact=${encodeURIComponent(telephone)}&nom=${encodeURIComponent(nom)}`;
  redirect(
    erreur
      ? `${retour}&erreur=${encodeURIComponent(erreur)}`
      : `/agent/orders/new?profileId=${encodeURIComponent(profileId ?? "")}`,
  );
}
