import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  accesTemporairesResetStaff,
  facteurs2faAdmin,
  piecesIdentiteStaff,
  accesTemporaireUtilisable,
  comptesStaff,
  ouvertureAccesTemporaireValide,
  peutRemplacerFacteur2fa,
  rolePeutActiverSecondFacteur,
} from "@/lib/db/schema/accounts";
import { StaffError, type ErreurStaff } from "./staff";

async function demandeurFacteurValide(demandeurId: string) {
  const demandeurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, demandeurId));
  const demandeur = demandeurs[0];
  if (!demandeur || !peutRemplacerFacteur2fa(demandeur.role, demandeur.etat)) {
    throw erreur("NON_AUTORISE", "seul un ADMIN_PRINCIPAL valide gère les accès");
  }
  return demandeur;
}

function erreur(code: ErreurStaff, message: string): StaffError {
  return new StaffError(code, message);
}

export async function declarerFacteur2faAdmin(input: {
  compteStaffId: string;
  nomAppareil: string;
  creePar: string;
}) {
  await demandeurFacteurValide(input.creePar);
  const titulaires = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, input.compteStaffId));
  const titulaire = titulaires[0];
  if (!titulaire || !rolePeutActiverSecondFacteur(titulaire.role)) {
    throw erreur("SECOND_FACTEUR_NON_REQUIS", "second facteur réservé aux comptes staff validés");
  }
  const existants = await db
    .select()
    .from(facteurs2faAdmin)
    .where(
      and(
        eq(facteurs2faAdmin.compteStaffId, input.compteStaffId),
        eq(facteurs2faAdmin.actif, true),
      ),
    );
  if (existants.length > 0) {
    throw erreur("FACTEUR_DEJA_EXISTANT", "un facteur actif existe déjà");
  }
  const id = randomUUID();
  await db.insert(facteurs2faAdmin).values({
    id,
    compteStaffId: input.compteStaffId,
    nomAppareil: input.nomAppareil,
    actif: true,
    creePar: input.creePar,
  });
  return { id };
}

export async function remplacerFacteur2faAdmin(input: {
  demandeurId: string;
  compteStaffId: string;
  nomAppareil: string;
}) {
  const demandeurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, input.demandeurId));
  const demandeur = demandeurs[0];
  if (!demandeur || !peutRemplacerFacteur2fa(demandeur.role, demandeur.etat)) {
    throw erreur("NON_AUTORISE", "seul un ADMIN_PRINCIPAL valide remplace");
  }
  const actifs = await db
    .select()
    .from(facteurs2faAdmin)
    .where(
      and(
        eq(facteurs2faAdmin.compteStaffId, input.compteStaffId),
        eq(facteurs2faAdmin.actif, true),
      ),
    );
  const ancien = actifs[0];
  if (!ancien) throw erreur("FACTEUR_INTROUVABLE", "aucun facteur actif");
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx
      .update(facteurs2faAdmin)
      .set({ actif: false, remplaceLe: new Date() })
      .where(eq(facteurs2faAdmin.id, ancien.id));
    await tx.insert(facteurs2faAdmin).values({
      id,
      compteStaffId: input.compteStaffId,
      nomAppareil: input.nomAppareil,
      actif: true,
      creePar: input.demandeurId,
    });
  });
  return { id, remplace: ancien.id };
}

export async function deposerPieceIdentiteStaff(input: {
  compteStaffId: string;
  typePiece: string;
  referenceImage: string;
  vuePar: string;
}) {
  await demandeurFacteurValide(input.vuePar);
  const titulaires = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, input.compteStaffId))
    .limit(1);
  if (!titulaires[0]) throw erreur("NON_AUTORISE", "compte staff inconnu");
  if (!input.referenceImage) throw erreur("PIECE_REQUISE", "pièce requise");
  const id = randomUUID();
  await db.insert(piecesIdentiteStaff).values({
    id,
    compteStaffId: input.compteStaffId,
    typePiece: input.typePiece,
    referenceImage: input.referenceImage,
    vuePar: input.vuePar,
  });
  return { id };
}

export async function ouvrirAccesTemporaireResetStaff(input: {
  compteStaffCible: string;
  ouvertPar: string;
  pieceId: string;
  dureeMinutes?: number;
}) {
  await demandeurFacteurValide(input.ouvertPar);
  const cibles = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, input.compteStaffCible))
    .limit(1);
  if (!cibles[0]) throw erreur("NON_AUTORISE", "compte staff inconnu");
  const pieces = await db
    .select({ id: piecesIdentiteStaff.id })
    .from(piecesIdentiteStaff)
    .where(eq(piecesIdentiteStaff.id, input.pieceId))
    .limit(1);
  if (!pieces[0]) throw erreur("PIECE_REQUISE", "pièce inconnue");
  const expireLe = new Date(
    Date.now() + (input.dureeMinutes ?? 60) * 60 * 1000,
  );
  if (!ouvertureAccesTemporaireValide(input.pieceId, expireLe)) {
    throw erreur("PIECE_REQUISE", "pièce vue et durée courte exigées");
  }
  const id = randomUUID();
  await db.insert(accesTemporairesResetStaff).values({
    id,
    compteStaffCible: input.compteStaffCible,
    ouvertPar: input.ouvertPar,
    pieceId: input.pieceId,
    expireLe,
    avertissementAffiche: true,
  });
  return { id, expireLe };
}

export async function consommerAccesTemporaireResetStaff(id: string) {
  const rows = await db
    .select()
    .from(accesTemporairesResetStaff)
    .where(eq(accesTemporairesResetStaff.id, id));
  const acces = rows[0];
  if (!acces) throw erreur("ACCES_EXPIRE", "accès inconnu");
  if (acces.consommeLe !== null) throw erreur("ACCES_CONSOMME", "déjà consommé");
  if (!accesTemporaireUtilisable(acces.consommeLe, acces.expireLe)) {
    throw erreur("ACCES_EXPIRE", "accès expiré");
  }
  await db
    .update(accesTemporairesResetStaff)
    .set({ consommeLe: new Date() })
    .where(eq(accesTemporairesResetStaff.id, id));
  return { id };
}
