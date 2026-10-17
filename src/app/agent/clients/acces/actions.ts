"use server";

import { staffConnecte } from "@/lib/s1-comptes/profil-session";
import { aPermission } from "@/lib/s2-autorisations/autorisations";
import {
  AccesProfilError,
  MESSAGES,
  confirmerAccesProfil,
  refuserDemandeAcces,
  revoquerAccesProfil,
} from "@/lib/s4-clients/acces-profil";

export type ResultatDecision =
  | { ok: true }
  | { ok: false; erreur: string };

type RefusServeur = { ok: false; erreur: string };

async function exigerPermissionServeur(
  permission: string,
): Promise<{ agentId: string } | RefusServeur> {
  const agent = await staffConnecte();
  if (!agent) {
    return { ok: false, erreur: "Session requise." };
  }
  if (!(await aPermission(agent.id, permission))) {
    return { ok: false, erreur: MESSAGES.PERMISSION_INSUFFISANTE };
  }
  return { agentId: agent.id };
}

function echec(erreur: unknown): ResultatDecision {
  if (erreur instanceof AccesProfilError) {
    return { ok: false, erreur: erreur.message };
  }
  return { ok: false, erreur: "Opération impossible." };
}

export async function confirmerAccesAction(demandeId: string): Promise<ResultatDecision> {
  const acces = await exigerPermissionServeur("client.acces_confirmer");
  if ("agentId" in acces === false) return acces;
  try {
    await confirmerAccesProfil({
      demandeId,
      agentId: acces.agentId,
      horodatageLocal: new Date(),
    });
    return { ok: true };
  } catch (erreur) {
    return echec(erreur);
  }
}

export async function refuserAccesAction(
  demandeId: string,
  motif: string,
): Promise<ResultatDecision> {
  const acces = await exigerPermissionServeur("client.acces_confirmer");
  if ("agentId" in acces === false) return acces;
  try {
    await refuserDemandeAcces({
      demandeId,
      agentId: acces.agentId,
      motif,
      horodatageLocal: new Date(),
    });
    return { ok: true };
  } catch (erreur) {
    return echec(erreur);
  }
}

export async function revoquerAccesAction(
  accesId: string,
  motif: string,
): Promise<ResultatDecision> {
  const acces = await exigerPermissionServeur("client.acces_revoquer");
  if ("agentId" in acces === false) return acces;
  try {
    await revoquerAccesProfil({
      accesId,
      agentId: acces.agentId,
      motif,
      horodatageLocal: new Date(),
    });
    return { ok: true };
  } catch (erreur) {
    return echec(erreur);
  }
}