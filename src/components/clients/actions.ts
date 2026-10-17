"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  comptesClients,
  comptesStaff,
  piecesIdentiteClients,
  transitionCompteClientValide,
} from "@/lib/db/schema/s1-comptes";
import {
  compteClientConnecte,
  retirerPiece,
  statuerPiece,
} from "@/lib/s1-comptes/pieces-clients";
import { typePieceValide } from "@/lib/s1-comptes/pieces-fichiers";
import { statutPieceValide, pieceRetirable, type StatutPiece } from "@/lib/s1-comptes/fiche-client";
import {
  enregistrerEvenement,
  journaliserRefusContestation,
  ERREUR_CONTESTEE_INTROUVABLE,
} from "@/lib/s2-autorisations/journal";
import { aPermission } from "@/lib/s2-autorisations/autorisations";
import {
  AnnotationError,
  poserEtiquette,
  retirerEtiquette,
} from "@/lib/s4-annotations/annotations";
import type { ResultatAction } from "@/lib/resultat-action";

export type ResultatDecision = ResultatAction<{ compteId: string }>;
export type ResultatAnnotation = ResultatAction<{
  compteId: string;
  etiquette: string;
}>;

async function peutTrancher(): Promise<{ id: string; role: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const moi = lignes[0];
  if (!moi) return null;
  if (moi.etat !== "VALIDE") return null;
  if (moi.role === "ADMIN_PRINCIPAL" || moi.role === "ADMIN_TECHNIQUE") {
    return { id: moi.id, role: moi.role };
  }
  if (moi.role === "AGENT") {
    if (await aPermission(moi.id, "client.valider")) {
      return { id: moi.id, role: moi.role };
    }
    return null;
  }
  return null;
}

const ERREUR_INTERDIT =
  "Seul un administrateur ou un agent autorisé peut trancher un compte client.";

function lireCompteId(donnees: FormData): string | null {
  const brut = String(donnees.get("compteId") ?? "").trim();
  return brut === "" ? null : brut;
}

function lireContesteId(donnees: FormData): string | null {
  const brut = String(donnees.get("contesteId") ?? "").trim();
  return brut === "" ? null : brut;
}

function revaliderLesDeuxEspaces() {
  revalidatePath("/admin/clients");
  revalidatePath("/admin/clients/validation");
  revalidatePath("/agent/clients");
  revalidatePath("/agent/clients/validation");
  revalidatePath("/admin/clients/[id]", "page");
  revalidatePath("/agent/clients/[id]", "page");
}

export async function validerCompteClientAction(
  _precedent: ResultatDecision | null,
  donnees: FormData,
): Promise<ResultatDecision> {
  const trancheur = await peutTrancher();
  if (!trancheur) return { ok: false, erreur: ERREUR_INTERDIT };
  const compteId = lireCompteId(donnees);
  if (!compteId) return { ok: false, erreur: "Compte introuvable." };
  const pieceId = String(donnees.get("pieceId") ?? "").trim();
  if (pieceId === "") {
    return {
      ok: false,
      erreur: "Pièce exigée : valider sans pièce vue est impossible.",
    };
  }

  const lignes = await db
    .select({ id: comptesClients.id, etat: comptesClients.etat })
    .from(comptesClients)
    .where(eq(comptesClients.id, compteId))
    .limit(1);
  const compte = lignes[0];
  if (!compte) return { ok: false, erreur: "Compte introuvable." };
  if (!transitionCompteClientValide(compte.etat, "VALIDE")) {
    return { ok: false, erreur: "Compte déjà traité : il n'est plus en attente." };
  }
  const pieces = await db
    .select({
      id: piecesIdentiteClients.id,
      compteClientId: piecesIdentiteClients.compteClientId,
    })
    .from(piecesIdentiteClients)
    .where(eq(piecesIdentiteClients.id, pieceId))
    .limit(1);
  const piece = pieces[0];
  if (!piece || piece.compteClientId !== compteId) {
    return {
      ok: false,
      erreur: "Pièce inconnue pour ce compte : validation impossible.",
    };
  }

  const maintenant = new Date();
  try {
    await db.transaction(async (tx) => {
      await statuerPiece(pieceId, trancheur.id, "ACCEPTEE", null, tx);
      await tx
        .update(comptesClients)
        .set({ etat: "VALIDE", valideLe: maintenant, refuseMotif: null })
        .where(
          and(
            eq(comptesClients.id, compteId),
            eq(comptesClients.etat, compte.etat),
          ),
        );
      const trace = await enregistrerEvenement(
        {
          acteurId: trancheur.id,
          roleAuMoment: trancheur.role,
          typeAction: "client.valider",
          entite: "compte_client",
          entiteId: compteId,
          avant: { etat: compte.etat },
          apres: { etat: "VALIDE", pieceId },
        },
        tx,
      );
      if (!trace.ok) throw new Error("Journal indisponible.");
    });
  } catch {
    return { ok: false, erreur: "Validation impossible : journal indisponible." };
  }
  revaliderLesDeuxEspaces();
  return { ok: true, compteId };
}

export async function refuserCompteClientAction(
  _precedent: ResultatDecision | null,
  donnees: FormData,
): Promise<ResultatDecision> {
  const trancheur = await peutTrancher();
  if (!trancheur) return { ok: false, erreur: ERREUR_INTERDIT };
  const compteId = lireCompteId(donnees);
  if (!compteId) return { ok: false, erreur: "Compte introuvable." };
  const motif = String(donnees.get("motif") ?? "").trim();
  if (motif.length < 3) {
    return { ok: false, erreur: "Motif exigé : un refus sans motif n'explique rien." };
  }
  if (motif.length > 500) {
    return { ok: false, erreur: "Motif trop long (500 caractères au plus)." };
  }

  const lignes = await db
    .select({ id: comptesClients.id, etat: comptesClients.etat })
    .from(comptesClients)
    .where(eq(comptesClients.id, compteId))
    .limit(1);
  const compte = lignes[0];
  if (!compte) return { ok: false, erreur: "Compte introuvable." };
  if (!transitionCompteClientValide(compte.etat, "REFUSE")) {
    return { ok: false, erreur: "Compte déjà traité : il n'est plus en attente." };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(comptesClients)
        .set({ etat: "REFUSE", refuseMotif: motif, valideLe: null })
        .where(
          and(
            eq(comptesClients.id, compteId),
            eq(comptesClients.etat, compte.etat),
          ),
        );
      const trace = await enregistrerEvenement(
        {
          acteurId: trancheur.id,
          roleAuMoment: trancheur.role,
          typeAction: "client.refuser",
          entite: "compte_client",
          entiteId: compteId,
          avant: { etat: compte.etat },
          apres: { etat: "REFUSE" },
          motif,
        },
        tx,
      );
      if (!trace.ok) throw new Error("Journal indisponible.");
    });
  } catch {
    return { ok: false, erreur: "Refus impossible : journal indisponible." };
  }
  revaliderLesDeuxEspaces();
  return { ok: true, compteId };
}

export async function statuerPieceIdentiteAction(
  _precedent: ResultatDecision | null,
  donnees: FormData,
): Promise<ResultatDecision> {
  const trancheur = await peutTrancher();
  if (!trancheur) return { ok: false, erreur: ERREUR_INTERDIT };
  const compteId = lireCompteId(donnees);
  if (!compteId) return { ok: false, erreur: "Compte introuvable." };
  const pieceId = String(donnees.get("pieceId") ?? "").trim();
  if (pieceId === "") return { ok: false, erreur: "Pièce exigée." };
  const statutBrut = String(donnees.get("statut") ?? "").trim();
  if (!statutPieceValide(statutBrut) || statutBrut === "EN_ATTENTE") {
    return { ok: false, erreur: "Verdict inconnu." };
  }
  const statut = statutBrut;
  const motif = String(donnees.get("motif") ?? "").trim();
  if (statut === "REFUSEE" && (motif.length < 3 || motif.length > 500)) {
    return {
      ok: false,
      erreur: "Motif exigé : un refus sans motif n'explique rien.",
    };
  }

  const comptes = await db
    .select({ id: comptesClients.id, etat: comptesClients.etat })
    .from(comptesClients)
    .where(eq(comptesClients.id, compteId))
    .limit(1);
  const compte = comptes[0];
  if (!compte) return { ok: false, erreur: "Compte introuvable." };
  if (compte.etat !== "VALIDE") {
    return {
      ok: false,
      erreur: "Ce compte se tranche, il ne se rejoue pas : sa validation prime.",
    };
  }

  const pieces = await db
    .select({
      id: piecesIdentiteClients.id,
      compteClientId: piecesIdentiteClients.compteClientId,
      statutPiece: piecesIdentiteClients.statutPiece,
    })
    .from(piecesIdentiteClients)
    .where(eq(piecesIdentiteClients.id, pieceId))
    .limit(1);
  const piece = pieces[0];
  if (!piece || piece.compteClientId !== compteId) {
    return { ok: false, erreur: "Pièce inconnue pour ce compte." };
  }
  if (piece.statutPiece !== "EN_ATTENTE") {
    return { ok: false, erreur: "Pièce déjà tranchée." };
  }

  const refusMotif = statut === "REFUSEE" ? motif : null;
  try {
    await db.transaction(async (tx) => {
      const ecrites = await statuerPiece(
        pieceId,
        trancheur.id,
        statut,
        refusMotif,
        tx,
      );
      if (ecrites === 0) throw new Error("Pièce déjà tranchée.");
      const trace = await enregistrerEvenement(
        {
          acteurId: trancheur.id,
          roleAuMoment: trancheur.role,
          typeAction: statut === "ACCEPTEE" ? "piece.accepter" : "piece.refuser",
          entite: "compte_client",
          entiteId: compteId,
          avant: { statutPiece: "EN_ATTENTE" },
          apres: { statutPiece: statut, pieceId },
          motif: refusMotif,
        },
        tx,
      );
      if (!trace.ok) throw new Error("Journal indisponible.");
    });
  } catch (erreur) {
    if (erreur instanceof Error && erreur.message === "Pièce déjà tranchée.") {
      return { ok: false, erreur: erreur.message };
    }
    return { ok: false, erreur: "Verdict impossible : journal indisponible." };
  }
  revaliderLesDeuxEspaces();
  revalidatePath("/clients/profile");
  return { ok: true, compteId };
}

export async function retirerPieceIdentiteAction(
  _precedent: ResultatDecision | null,
  donnees: FormData,
): Promise<ResultatDecision> {
  const compte = await compteClientConnecte();
  if (!compte) {
    return {
      ok: false,
      erreur: "Connectez-vous avec votre compte client pour retirer une pièce.",
    };
  }
  const pieceId = String(donnees.get("pieceId") ?? "").trim();
  if (pieceId === "") return { ok: false, erreur: "Pièce exigée." };

  const pieces = await db
    .select({
      id: piecesIdentiteClients.id,
      compteClientId: piecesIdentiteClients.compteClientId,
      statutPiece: piecesIdentiteClients.statutPiece,
    })
    .from(piecesIdentiteClients)
    .where(eq(piecesIdentiteClients.id, pieceId))
    .limit(1);
  const piece = pieces[0];
  if (!piece || piece.compteClientId !== compte.id) {
    return { ok: false, erreur: "Pièce inconnue pour ce compte." };
  }
  if (!pieceRetirable({ statutPiece: piece.statutPiece as StatutPiece })) {
    return {
      ok: false,
      erreur: "Seule une pièce refusée peut être retirée, et une seule fois.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      const ecrites = await retirerPiece(pieceId, compte.id, tx);
      if (ecrites === 0) throw new Error("Pièce déjà retirée.");
      const trace = await enregistrerEvenement(
        {
          acteurId: compte.id,
          roleAuMoment: "CLIENT",
          typeAction: "piece.retirer",
          entite: "compte_client",
          entiteId: compte.id,
          avant: { statutPiece: piece.statutPiece },
          apres: { statutPiece: "RETIREE", pieceId },
        },
        tx,
      );
      if (!trace.ok) throw new Error("Journal indisponible.");
    });
  } catch (erreur) {
    if (erreur instanceof Error && erreur.message === "Pièce déjà retirée.") {
      return { ok: false, erreur: erreur.message };
    }
    return { ok: false, erreur: "Retrait impossible : journal indisponible." };
  }
  revaliderLesDeuxEspaces();
  revalidatePath("/clients/profile");
  return { ok: true, compteId: compte.id };
}

export async function validerCompteClientComptoirAction(
  _precedent: ResultatDecision | null,
  donnees: FormData,
): Promise<ResultatDecision> {
  const trancheur = await peutTrancher();
  if (!trancheur) return { ok: false, erreur: ERREUR_INTERDIT };
  const compteId = lireCompteId(donnees);
  if (!compteId) return { ok: false, erreur: "Compte introuvable." };
  const typePiece = String(donnees.get("typePiece") ?? "").trim();
  if (!typePieceValide(typePiece)) {
    return { ok: false, erreur: "Type de pièce inconnu." };
  }

  const lignes = await db
    .select({ id: comptesClients.id, etat: comptesClients.etat })
    .from(comptesClients)
    .where(eq(comptesClients.id, compteId))
    .limit(1);
  const compte = lignes[0];
  if (!compte) return { ok: false, erreur: "Compte introuvable." };
  if (!transitionCompteClientValide(compte.etat, "VALIDE")) {
    return { ok: false, erreur: "Compte déjà traité : il n'est plus en attente." };
  }

  const maintenant = new Date();
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(comptesClients)
        .set({ etat: "VALIDE", valideLe: maintenant, refuseMotif: null })
        .where(
          and(
            eq(comptesClients.id, compteId),
            eq(comptesClients.etat, compte.etat),
          ),
        );
      const trace = await enregistrerEvenement(
        {
          acteurId: trancheur.id,
          roleAuMoment: trancheur.role,
          typeAction: "client.valider",
          entite: "compte_client",
          entiteId: compteId,
          avant: { etat: compte.etat },
          apres: { etat: "VALIDE", vuAuComptoir: true, typePiece },
        },
        tx,
      );
      if (!trace.ok) throw new Error("Journal indisponible.");
    });
  } catch {
    return { ok: false, erreur: "Validation impossible : journal indisponible." };
  }
  revaliderLesDeuxEspaces();
  return { ok: true, compteId };
}

export async function revoquerCompteClientAction(
  _precedent: ResultatDecision | null,
  donnees: FormData,
): Promise<ResultatDecision> {
  const trancheur = await peutTrancher();
  if (!trancheur) {
    const contesteId = lireContesteId(donnees);
    if (contesteId) {
      const session = await auth.api.getSession({ headers: await headers() });
      const lignes = session?.user?.id
        ? await db
            .select({ id: comptesStaff.id, role: comptesStaff.role })
            .from(comptesStaff)
            .where(eq(comptesStaff.betterAuthUserId, session.user.id))
            .limit(1)
        : [];
      await journaliserRefusContestation({
        acteurId: lignes[0]?.id ?? null,
        roleAuMoment: lignes[0]?.role ?? "INCONNU",
        typeAction: "client.revoquer",
        entite: "compte_client",
        entiteId: lireCompteId(donnees),
        motif: ERREUR_INTERDIT,
        contesteId,
      });
    }
    return { ok: false, erreur: ERREUR_INTERDIT };
  }
  const compteId = lireCompteId(donnees);
  if (!compteId) return { ok: false, erreur: "Compte introuvable." };
  const motif = String(donnees.get("motif") ?? "").trim();
  if (motif.length < 3) {
    return { ok: false, erreur: "Motif exigé : une révocation sans motif n'explique rien." };
  }
  if (motif.length > 500) {
    return { ok: false, erreur: "Motif trop long (500 caractères au plus)." };
  }

  const lignes = await db
    .select({ id: comptesClients.id, etat: comptesClients.etat })
    .from(comptesClients)
    .where(eq(comptesClients.id, compteId))
    .limit(1);
  const compte = lignes[0];
  if (!compte) return { ok: false, erreur: "Compte introuvable." };
  if (!transitionCompteClientValide(compte.etat, "REVOQUE")) {
    return { ok: false, erreur: "Compte déjà traité : il n'est plus en attente." };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(comptesClients)
        .set({ etat: "REVOQUE", refuseMotif: motif, valideLe: null })
        .where(
          and(
            eq(comptesClients.id, compteId),
            eq(comptesClients.etat, compte.etat),
          ),
        );
      const trace = await enregistrerEvenement(
        {
          acteurId: trancheur.id,
          roleAuMoment: trancheur.role,
          typeAction: "client.revoquer",
          entite: "compte_client",
          entiteId: compteId,
          avant: { etat: compte.etat },
          apres: { etat: "REVOQUE" },
          motif,
          contesteId: lireContesteId(donnees),
        },
        tx,
      );
      if (!trace.ok) throw new Error(trace.erreur);
    });
  } catch (erreur) {
    if (
      erreur instanceof Error &&
      erreur.message === ERREUR_CONTESTEE_INTROUVABLE
    ) {
      return { ok: false, erreur: ERREUR_CONTESTEE_INTROUVABLE };
    }
    return { ok: false, erreur: "Révocation impossible : journal indisponible." };
  }
  revaliderLesDeuxEspaces();
  return { ok: true, compteId };
}

async function peutAnnoter(): Promise<{ id: string; role: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const moi = lignes[0];
  if (!moi) return null;
  if (moi.etat !== "VALIDE") return null;
  if (moi.role === "ADMIN_PRINCIPAL") {
    return { id: moi.id, role: moi.role };
  }
  if (moi.role === "ADMIN_TECHNIQUE") return null;
  if (moi.role === "AGENT") {
    if (await aPermission(moi.id, "client.annoter")) {
      return { id: moi.id, role: moi.role };
    }
    return null;
  }
  return null;
}

const ERREUR_NON_ANNOTATEUR =
  "Annotation réservée aux comptes autorisés (« client.annoter »).";

function lireEtiquette(donnees: FormData): string {
  return String(donnees.get("etiquette") ?? "").trim();
}

function messageAnnotation(code: string): string {
  switch (code) {
    case "COMPTE_INTROUVABLE":
      return "Compte introuvable.";
    case "ETIQUETTE_INCONNUE":
      return "Étiquette inconnue.";
    default:
      return "Annotation impossible : journal indisponible.";
  }
}

export async function poserEtiquetteAction(
  _precedent: ResultatAnnotation | null,
  donnees: FormData,
): Promise<ResultatAnnotation> {
  const annotateur = await peutAnnoter();
  if (!annotateur) return { ok: false, erreur: ERREUR_NON_ANNOTATEUR };
  const compteId = lireCompteId(donnees);
  if (!compteId) return { ok: false, erreur: "Compte introuvable." };
  const etiquette = lireEtiquette(donnees);
  try {
    await poserEtiquette({
      acteurId: annotateur.id,
      roleAuMoment: annotateur.role,
      compteClientId: compteId,
      etiquette,
    });
  } catch (erreur) {
    if (erreur instanceof AnnotationError) {
      return { ok: false, erreur: messageAnnotation(erreur.code) };
    }
    return { ok: false, erreur: "Annotation impossible : journal indisponible." };
  }
  revaliderLesDeuxEspaces();
  return { ok: true, compteId, etiquette };
}

export async function retirerEtiquetteAction(
  _precedent: ResultatAnnotation | null,
  donnees: FormData,
): Promise<ResultatAnnotation> {
  const annotateur = await peutAnnoter();
  if (!annotateur) return { ok: false, erreur: ERREUR_NON_ANNOTATEUR };
  const compteId = lireCompteId(donnees);
  if (!compteId) return { ok: false, erreur: "Compte introuvable." };
  const etiquette = lireEtiquette(donnees);
  try {
    await retirerEtiquette({
      acteurId: annotateur.id,
      roleAuMoment: annotateur.role,
      compteClientId: compteId,
      etiquette,
    });
  } catch (erreur) {
    if (erreur instanceof AnnotationError) {
      return { ok: false, erreur: messageAnnotation(erreur.code) };
    }
    return { ok: false, erreur: "Annotation impossible : journal indisponible." };
  }
  revaliderLesDeuxEspaces();
  return { ok: true, compteId, etiquette };
}
