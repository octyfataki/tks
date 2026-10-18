"use server";

import { revalidatePath } from "next/cache";
import type { ResultatAction } from "@/lib/action-result";
import { PriceGridError, publishPrice } from "@/modules/pricing/publish";

export type ResultatPrix = ResultatAction<{
  network: string;
  amount: number;
  currency: string;
  effectiveAt: string;
}>;

function lireChamp(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export async function publierPrixAction(
  _precedent: ResultatPrix | null,
  donnees: FormData,
): Promise<ResultatPrix> {
  try {
    const ligne = await publishPrice({
      network: lireChamp(donnees, "network"),
      amount: lireChamp(donnees, "amount"),
      currency: lireChamp(donnees, "currency"),
    });
    revalidatePath("/admin/pricing");
    return {
      ok: true,
      network: ligne.network,
      amount: ligne.amount,
      currency: ligne.currency,
      effectiveAt: ligne.effectiveAt.toISOString(),
    };
  } catch (erreur) {
    if (erreur instanceof PriceGridError) {
      return { ok: false, erreur: erreur.message };
    }
    throw erreur;
  }
}
