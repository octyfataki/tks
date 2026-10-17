import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import {
  accesProfilClients,
  demandesAccesProfil,
  profilsClients,
} from "@/lib/db/schema/s4-clients";
import { comptesClients } from "@/lib/db/schema/s1-comptes";
import { aPermission } from "@/lib/s2-autorisations/autorisations";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";

export type ErreurAccesProfil =
  | "PERMISSION_INSUFFISANTE"
  | "COMPTE_INTROUVABLE"
  | "COMPTE_NON_VALIDE"
  | "PROFIL_INTROUVABLE"
  | "DEMANDE_INTROUVABLE"
  | "DEMANDE_DEJA_TRAITEE"
  | "DEMANDE_DEJA_OUVERTE"
  | "ACCES_INTROUVABLE"
  | "ACCES_DEJA_ACCORDE"
  | "MOTIF_REQUIS"
  | "JOURNAL_INDISPONIBLE";

export class AccesProfilError extends Error {
  code: ErreurAccesProfil;
  constructor(code: ErreurAccesProfil, message: string) {
    super(message);
    this.code = code;
  }
}

export const MESSAGES: Record<ErreurAccesProfil, string> = {
  PERMISSION_INSUFFISANTE: "Permission requise : vous ne pouvez pas décider cet accès.",
  COMPTE_INTROUVABLE: "Compte client introuvable.",
  COMPTE_NON_VALIDE: "Ce compte n'est pas validé : aucune donnée financière ne lui est accessible.",
  PROFIL_INTROUVABLE: "Profil client introuvable.",
  DEMANDE_INTROUVABLE: "Demande d'accès introuvable.",
  DEMANDE_DEJA_TRAITEE: "Cette demande a déjà reçu une décision.",
  DEMANDE_DEJA_OUVERTE: "Une demande d'accès est déjà ouverte pour ce compte.",
  ACCES_INTROUVABLE: "Accès introuvable.",
  ACCES_DEJA_ACCORDE: "Ce compte dispose déjà d'un accès actif à un profil.",
  MOTIF_REQUIS: "Un motif lisible est obligatoire (3 à 500 caractères).",
  JOURNAL_INDISPONIBLE: "Journal indisponible : aucune décision n'a été enregistrée.",
};

function exigerMotif(motif: string | null | undefined): string {
  const taille = motif?.trim().length ?? 0;
  if (taille < 3 || taille > 500) {
    throw new AccesProfilError("MOTIF_REQUIS", MESSAGES.MOTIF_REQUIS);
  }
  return motif!.trim();
}

async function exigerPermission(agentId: string, permission: string): Promise<void> {
  if (!(await aPermission(agentId, permission))) {
    throw new AccesProfilError("PERMISSION_INSUFFISANTE", MESSAGES.PERMISSION_INSUFFISANTE);
  }
}

async function tracerAcces(
  ex: ExecuteurDb,
  evenement: Parameters<typeof enregistrerEvenement>[0],
): Promise<void> {
  const trace = await enregistrerEvenement(evenement, ex);
  if (!trace.ok) {
    throw new AccesProfilError("JOURNAL_INDISPONIBLE", MESSAGES.JOURNAL_INDISPONIBLE);
  }
}

function estDoublon(erreur: unknown): boolean {
  const code = (erreur as { code?: unknown })?.code;
  if (code === "ER_DUP_ENTRY") return true;
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  return message.includes("Duplicate entry");
}

/**
 * Le compte doit être VALIDE : c'est l'invariant 7. La validation prouve qui
 * se connecte, elle ne remplace pas la décision d'accès au profil.
 */
async function exigerCompteValide(compteClientId: string): Promise<void> {
  const lignes = await db
    .select({ etat: comptesClients.etat })
    .from(comptesClients)
    .where(eq(comptesClients.id, compteClientId))
    .limit(1);
  const compte = lignes[0];
  if (!compte) {
    throw new AccesProfilError("COMPTE_INTROUVABLE", MESSAGES.COMPTE_INTROUVABLE);
  }
  if (compte.etat !== "VALIDE") {
    throw new AccesProfilError("COMPTE_NON_VALIDE", MESSAGES.COMPTE_NON_VALIDE);
  }
}

/**
 * Ouvre une demande d'accès lorsqu'une correspondance possible est détectée.
 * L'indice qui a déclenché la détection est conservé pour l'agent, mais il
 * n'accorde rien : seul le profil visé est écrit, jamais un numéro de
 * téléphone. Un téléphone reste un indice de recherche, jamais une preuve.
 */
export async function creerDemandeAcces(input: {
  compteClientId: string;
  profilClientId: string;
  indiceDetection?: string | null;
  horodatageLocal: Date;
}): Promise<{ demandeId: string }> {
  await exigerCompteValide(input.compteClientId);

  const profils = await db
    .select({ id: profilsClients.id })
    .from(profilsClients)
    .where(eq(profilsClients.id, input.profilClientId))
    .limit(1);
  if (profils.length === 0) {
    throw new AccesProfilError("PROFIL_INTROUVABLE", MESSAGES.PROFIL_INTROUVABLE);
  }

  const ouvertes = await db
    .select({ id: demandesAccesProfil.id })
    .from(demandesAccesProfil)
    .where(
      and(
        eq(demandesAccesProfil.compteClientId, input.compteClientId),
        eq(demandesAccesProfil.statut, "EN_ATTENTE"),
      ),
    )
    .limit(1);
  if (ouvertes.length > 0) {
    throw new AccesProfilError("DEMANDE_DEJA_OUVERTE", MESSAGES.DEMANDE_DEJA_OUVERTE);
  }

  const demandeId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(demandesAccesProfil).values({
      id: demandeId,
      compteClientId: input.compteClientId,
      profilClientId: input.profilClientId,
      statut: "EN_ATTENTE",
      indiceDetection: input.indiceDetection ?? null,
      horodatageLocal: input.horodatageLocal,
    });
    await tracerAcces(tx, {
      acteurId: input.compteClientId,
      roleAuMoment: "CLIENT",
      typeAction: "profil.acces.demande",
      entite: "demande_acces_profil",
      entiteId: demandeId,
      apres: {
        compteClientId: input.compteClientId,
        profilClientId: input.profilClientId,
        indiceDetection: input.indiceDetection ?? null,
      },
    });
  });
  return { demandeId };
}

async function chargerDemandeExe(demandeId: string) {
  const lignes = await db
    .select()
    .from(demandesAccesProfil)
    .where(eq(demandesAccesProfil.id, demandeId))
    .limit(1);
  const demande = lignes[0];
  if (!demande) {
    throw new AccesProfilError("DEMANDE_INTROUVABLE", MESSAGES.DEMANDE_INTROUVABLE);
  }
  if (demande.statut !== "EN_ATTENTE") {
    throw new AccesProfilError("DEMANDE_DEJA_TRAITEE", MESSAGES.DEMANDE_DEJA_TRAITEE);
  }
  return demande;
}

/**
 * Confirme la demande et accorde l'accès dans la même transaction que le
 * journal. Aucune écriture financière n'est touchée : l'accès ne déplace que
 * l'autorisation de lire le profil.
 */
export async function confirmerAccesProfil(input: {
  demandeId: string;
  agentId: string;
  horodatageLocal: Date;
}): Promise<void> {
  await exigerPermission(input.agentId, "client.acces_confirmer");
  const demande = await chargerDemandeExe(input.demandeId);
  await exigerCompteValide(demande.compteClientId);

  const accesId = randomUUID();
  await db.transaction(async (tx) => {
    try {
      await tx.insert(accesProfilClients).values({
        id: accesId,
        compteClientId: demande.compteClientId,
        profilClientId: demande.profilClientId,
        statut: "ACCORDE",
        decidePar: input.agentId,
        horodatageLocal: input.horodatageLocal,
      });
    } catch (erreur) {
      if (estDoublon(erreur)) {
        throw new AccesProfilError("ACCES_DEJA_ACCORDE", MESSAGES.ACCES_DEJA_ACCORDE);
      }
      throw erreur;
    }
    await tx
      .update(demandesAccesProfil)
      .set({
        statut: "ACCORDEE",
        decidePar: input.agentId,
        decideLe: input.horodatageLocal,
      })
      .where(eq(demandesAccesProfil.id, demande.id));
    await tracerAcces(tx, {
      acteurId: input.agentId,
      roleAuMoment: "AGENT",
      typeAction: "profil.acces.confirmer",
      entite: "acces_profil_client",
      entiteId: accesId,
      apres: {
        demandeId: demande.id,
        compteClientId: demande.compteClientId,
        profilClientId: demande.profilClientId,
      },
    });
  });
}

export async function refuserDemandeAcces(input: {
  demandeId: string;
  agentId: string;
  motif: string;
  horodatageLocal: Date;
}): Promise<void> {
  await exigerPermission(input.agentId, "client.acces_confirmer");
  const motif = exigerMotif(input.motif);
  const demande = await chargerDemandeExe(input.demandeId);

  await db.transaction(async (tx) => {
    await tx
      .update(demandesAccesProfil)
      .set({
        statut: "REFUSEE",
        motif,
        decidePar: input.agentId,
        decideLe: input.horodatageLocal,
      })
      .where(eq(demandesAccesProfil.id, demande.id));
    await tracerAcces(tx, {
      acteurId: input.agentId,
      roleAuMoment: "AGENT",
      typeAction: "profil.acces.refuser",
      entite: "demande_acces_profil",
      entiteId: demande.id,
      motif,
      apres: {
        compteClientId: demande.compteClientId,
        profilClientId: demande.profilClientId,
      },
    });
  });
}

export async function revoquerAccesProfil(input: {
  accesId: string;
  agentId: string;
  motif: string;
  horodatageLocal: Date;
}): Promise<void> {
  await exigerPermission(input.agentId, "client.acces_revoquer");
  const motif = exigerMotif(input.motif);

  const lignes = await db
    .select()
    .from(accesProfilClients)
    .where(eq(accesProfilClients.id, input.accesId))
    .limit(1);
  const acces = lignes[0];
  if (!acces) {
    throw new AccesProfilError("ACCES_INTROUVABLE", MESSAGES.ACCES_INTROUVABLE);
  }
  if (acces.statut !== "ACCORDE") {
    throw new AccesProfilError("DEMANDE_DEJA_TRAITEE", "Cet accès est déjà révoqué.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(accesProfilClients)
      .set({ statut: "REVOKE", motif })
      .where(eq(accesProfilClients.id, acces.id));
    await tracerAcces(tx, {
      acteurId: input.agentId,
      roleAuMoment: "AGENT",
      typeAction: "profil.acces.revoquer",
      entite: "acces_profil_client",
      entiteId: acces.id,
      avant: { statut: acces.statut },
      motif,
      apres: {
        compteClientId: acces.compteClientId,
        profilClientId: acces.profilClientId,
      },
    });
  });
}

export type DemandeEnAttente = {
  demandeId: string;
  compteClientId: string;
  profilClientId: string;
  nomProfil: string;
  indiceDetection: string | null;
};

export async function listerDemandesAccesEnAttente(): Promise<DemandeEnAttente[]> {
  return db
    .select({
      demandeId: demandesAccesProfil.id,
      compteClientId: demandesAccesProfil.compteClientId,
      profilClientId: demandesAccesProfil.profilClientId,
      nomProfil: profilsClients.nom,
      indiceDetection: demandesAccesProfil.indiceDetection,
    })
    .from(demandesAccesProfil)
    .innerJoin(
      profilsClients,
      eq(demandesAccesProfil.profilClientId, profilsClients.id),
    )
    .where(eq(demandesAccesProfil.statut, "EN_ATTENTE"));
}

/**
 * Seul chemin d'accès aux données d'un profil. Un compte sans accès actif
 * obtient `null` : c'est cette fonction que S5 et S6 devront consommer, et
 * non une lecture directe du profil par numéro de téléphone.
 */
export async function profilAutorisePourCompte(
  compteClientId: string,
): Promise<{ profilClientId: string } | null> {
  await exigerCompteValide(compteClientId);
  const lignes = await db
    .select({ profilClientId: accesProfilClients.profilClientId })
    .from(accesProfilClients)
    .where(
      and(
        eq(accesProfilClients.compteClientId, compteClientId),
        eq(accesProfilClients.statut, "ACCORDE"),
      ),
    )
    .limit(1);
  return lignes[0] ?? null;
}