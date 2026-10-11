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
import { marquerPieceVue } from "@/lib/s1-comptes/pieces-clients";
import { typePieceValide } from "@/lib/s1-comptes/pieces-fichiers";
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

/**
 * Connecté et autorisé à trancher un compte client (S1-03) :
 * - ADMIN_PRINCIPAL ou ADMIN_TECHNIQUE VALIDE, ou
 * - AGENT VALIDE avec la permission `client.valider` (socle ou individuelle).
 *
 * Jamais un client, jamais un compte suspendu ou révoqué, jamais un agent
 * sans la permission.
 */
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

/**
 * S2 issue 15 — ligne contestée depuis le journal (champ caché du
 * formulaire de contestation, absent des parcours normaux). `null` =
 * parcours normal, sans lien.
 */
function lireContesteId(donnees: FormData): string | null {
  const brut = String(donnees.get("contesteId") ?? "").trim();
  return brut === "" ? null : brut;
}

/** Revalide les deux espaces : la décision peut venir de l'un ou l'autre. */
function revaliderLesDeuxEspaces() {
  revalidatePath("/admin/clients");
  revalidatePath("/admin/clients/validation");
  revalidatePath("/agent/clients");
  revalidatePath("/agent/clients/validation");
  // Les fiches sont des routes dynamiques : le motif + « page » revalide
  // toutes les fiches ouvertes (Next 16 l'exige pour un segment dynamique).
  revalidatePath("/admin/clients/[id]", "page");
  revalidatePath("/agent/clients/[id]", "page");
}

/**
 * Valide un compte client sur la pièce vue par l'humain qui tranche. La
 * pièce est désignée par son identifiant (déposée par le client dans
 * l'application), jamais par une référence tapée : vide ou étrangère au
 * compte = refusé, aucun chemin ne produit VALIDE sans pièce vue. Succès
 * apparent sans écriture impossible : pièce marquée vue, état et journal
 * partent dans une seule transaction, journal indisponible = tout annulé.
 */
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
      await marquerPieceVue(pieceId, trancheur.id, tx);
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

/**
 * Refuse un compte client avec un motif obligatoire. Le motif est stocké sur
 * le compte et affiché au client, qui peut corriger puis être validé plus
 * tard sans ressaisie (REFUSE → VALIDE reste ouvert).
 */
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

/**
 * Valide un compte client sur pièce physique vue au comptoir, sans dépôt
 * numérique. Le client venu avec sa pièce ne repart pas bredouille parce
 * que personne ne l'a déposée : l'agent ou l'administrateur atteste l'avoir
 * vue (type coché en liste fermée, jamais saisi librement) et tranche.
 * L'invariant tient — aucun VALIDE sans pièce vue, et la vue est tracée
 * (qui, quand, quel compte, quel type) dans le journal.
 */
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

/**
 * Révoque un compte client suspect (EN_ATTENTE_VALIDATION → REVOQUE ou
 * REFUSE → REVOQUE, définitif : aucun retour — rouvrir passe par
 * réinscription, GLOSSARY « Compte »).
 *
 * C'est la « suppression » de la file : aucune suppression physique —
 * invariant 10 (on n'efface jamais, on trace) et journal immuable (invariant
 * 8). Le compte sort de la file (la file ne liste que EN_ATTENTE_VALIDATION +
 * REFUSE), reste visible dans la liste des comptes avec le filtre
 * « Révoqués », et la décision est journalisée (`client.revoquer`, qui,
 * quand, quel compte, motif). Le motif est obligatoire et conservé sur le
 * compte.
 */
export async function revoquerCompteClientAction(
  _precedent: ResultatDecision | null,
  donnees: FormData,
): Promise<ResultatDecision> {
  const trancheur = await peutTrancher();
  if (!trancheur) {
    // S2 issue 15 — un refus opposé à une contestation est journalisé comme
    // échec, lié à la ligne contestée.
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
    // Cause vraie : une contestation vers une ligne inconnue le dit, le
    // reste reste un échec fermé générique.
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

/**
 * Connecté et autorisé à annoter un compte client (S4 issue #7) :
 * - ADMIN_PRINCIPAL VALIDE (le distributeur annote toujours),
 * - AGENT VALIDE avec la permission `client.annoter` (socle ou individuelle).
 *
 * L'administrateur technique n'annote jamais : aucun pouvoir métier
 * (GLOSSARY « Administrateur technique »), comme `rolePeutSaisirTaux` (S3).
 * Même forme que `peutTrancher`, autre permission : lire n'exige rien,
 * écrire exige `client.annoter`.
 */
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

/**
 * Pose une étiquette sur un compte client (S4 issue #7). Liste fermée :
 * un code inconnu est refusé, jamais enregistré. L'écriture est
 * append-only et journalisée dans la même transaction (couche
 * `s4-annotations`) : journal indisponible = geste annulé.
 */
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

/**
 * Retire une étiquette d'un compte client (S4 issue #7). Aucune ligne
 * n'est supprimée : l'écriture inverse est ajoutée et tracée
 * (invariant 10). Même autorisation et mêmes échecs fermés que la pose.
 */
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
