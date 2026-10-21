"use server";

import { revalidatePath } from "next/cache";
import type { ResultatAction } from "@/lib/action-result";
import {
  CashError,
  compteLabel,
  type AccountDraft,
  type MovementDraft,
  type TransferDraft,
} from "@/modules/treasury/cash-record";
import {
  corriger as corrigerMouvement,
  enregistrerMouvement as poserMouvement,
  lireTotaux as lireTotauxPeriode,
  ouvrirCompte as ouvrirUnCompte,
  transferer as poserTransfert,
  type CompteOuvert,
  type CorrectionPosee,
  type MovementEnregistre,
  type TotauxPeriode,
  type TransfertEnregistre,
} from "@/modules/treasury/publish";

export type ResultatOuvertureCompte = ResultatAction<{ compte: CompteOuvert }>;

export type ResultatMouvement = ResultatAction<{ mouvement: MovementEnregistre }>;

export type ResultatTransfert = ResultatAction<{ transfert: TransfertEnregistre }>;

export type ResultatCorrection = ResultatAction<{ correction: CorrectionPosee }>;

export type ResultatTotaux = ResultatAction<{ totaux: TotauxPeriode }>;

function messageCash(erreur: CashError): string {
  return erreur.message;
}

export async function ouvrirCompteAction(
  draft: AccountDraft,
): Promise<ResultatOuvertureCompte> {
  try {
    const compte = await ouvrirUnCompte(draft);
    revalidatePath("/admin", "layout");
    revalidatePath("/agent", "layout");
    return { ok: true, compte: { ...compte, label: compteLabel(compte) } };
  } catch (erreur) {
    if (erreur instanceof CashError) {
      return { ok: false, erreur: messageCash(erreur) };
    }
    return { ok: false, erreur: "Ouverture impossible." };
  }
}

export async function enregistrerMouvementAction(
  draft: MovementDraft,
): Promise<ResultatMouvement> {
  try {
    const mouvement = await poserMouvement(draft);
    revalidatePath("/admin", "layout");
    revalidatePath("/agent", "layout");
    return { ok: true, mouvement };
  } catch (erreur) {
    if (erreur instanceof CashError) {
      return { ok: false, erreur: messageCash(erreur) };
    }
    return { ok: false, erreur: "Mouvement impossible." };
  }
}

export async function transfererAction(
  draft: TransferDraft,
): Promise<ResultatTransfert> {
  try {
    const transfert = await poserTransfert(draft);
    revalidatePath("/admin", "layout");
    revalidatePath("/agent", "layout");
    return { ok: true, transfert };
  } catch (erreur) {
    if (erreur instanceof CashError) {
      return { ok: false, erreur: messageCash(erreur) };
    }
    return { ok: false, erreur: "Transfert impossible." };
  }
}

export async function corrigerAction(
  mouvementId: string,
  motif: string,
): Promise<ResultatCorrection> {
  try {
    const correction = await corrigerMouvement(mouvementId, motif);
    revalidatePath("/admin", "layout");
    revalidatePath("/agent", "layout");
    return { ok: true, correction };
  } catch (erreur) {
    if (erreur instanceof CashError) {
      return { ok: false, erreur: messageCash(erreur) };
    }
    return { ok: false, erreur: "Correction impossible." };
  }
}

export async function lireTotauxAction(
  du: string,
  au: string,
): Promise<ResultatTotaux> {
  const modeleJour = /^\d{4}-\d{2}-\d{2}$/;
  if (!modeleJour.test(du) || !modeleJour.test(au)) {
    return { ok: false, erreur: "Dates invalides : format attendu AAAA-MM-JJ." };
  }
  const debut = new Date(`${du}T00:00:00Z`);
  const fin = new Date(`${au}T23:59:59Z`);
  if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || debut > fin) {
    return { ok: false, erreur: "Période invalide : la fin précède le début." };
  }
  try {
    const totaux = await lireTotauxPeriode(debut, fin);
    return { ok: true, totaux };
  } catch {
    return { ok: false, erreur: "Totaux indisponibles pour cette période." };
  }
}
