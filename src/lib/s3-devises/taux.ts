import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import {
  dateDuJourKinshasa,
  jourValide,
  rolePeutSaisirTaux,
  tauxChange,
  valeurTauxValide,
} from "@/lib/db/schema/s3-devises";
import { aPermission } from "@/lib/s2-autorisations/autorisations";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";

// S3 — taux du jour (première tranche du modèle monétaire). Le taux est un
// paramètre de lecture, résolu au calcul, jamais capturé sur une écriture
// (ADR-0001) : cette couche ne fait que le saisir et le relire.
//
// Invariants tenus ici :
// - Un jour porte au plus un taux. L'unicité est garantie par la base
//   (`jour` UNIQUE) ET contrôlée avant écriture pour un refus lisible. Une
//   seconde valeur ne remplace jamais la première (invariant S3).
// - La saisie est une écriture métier journalisée (S2, invariant 8) : état
//   métier + trace partent dans une seule transaction, journal indisponible
//   = tout annulé (échec fermé).
// - Autorisation : administrateur principal VALIDE, ou agent de service
//   VALIDE détenteur de la permission `taux.saisir`. Jamais l'administrateur
//   technique (aucun pouvoir métier, S2 §Frontière).
//
// ÉCART ASSUMÉ à S3 / GLOSSARY (« saisi par l'administrateur principal ») :
// les agents concernés peuvent saisir sur permission explicite. Décision
// produit consignée sur l'issue GitHub #10 ; le taux reste unique par jour et
// entièrement tracé, la couture d'autorisation est celle de S2.

export type ErreurTaux =
  | "NON_AUTORISE"
  | "VALEUR_INVALIDE"
  | "JOUR_INVALIDE"
  | "DEJA_DEFINI"
  | "JOURNAL_INDISPONIBLE";

export class TauxError extends Error {
  code: ErreurTaux;
  constructor(code: ErreurTaux, message: string) {
    super(message);
    this.code = code;
  }
}

/** Le taux en vigueur d'un jour, tel que lu (nom d'auteur résolu si connu). */
export type TauxDuJourLu = {
  /** Jour civil de Kinshasa, AAAA-MM-JJ. */
  jour: string;
  /** Francs pour 1 USD. */
  valeur: number;
  /** Identifiant du compte staff auteur, si connu. */
  saisiParId: string | null;
  /** Nom affichable de l'auteur, si connu. */
  saisiParNom: string | null;
};

/** Compte staff minimal nécessaire à la décision d'autorisation. */
type CompteStaffMinimal = { id: string; role: string; etat: string };

/** Autorise (ou non) la saisie du taux pour un compte staff donné. */
export async function autoriserSaisieTaux(
  compte: CompteStaffMinimal,
): Promise<boolean> {
  const decision = rolePeutSaisirTaux(compte.role, compte.etat);
  if (decision !== null) return decision;
  return aPermission(compte.id, "taux.saisir");
}

async function staffParId(id: string): Promise<CompteStaffMinimal | null> {
  const lignes = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, id))
    .limit(1);
  return lignes[0] ?? null;
}

/** Doublon d'insertion concurrent (contrainte d'unicité MySQL). */
function estDoublon(erreur: unknown): boolean {
  const textes: string[] = [];
  let courante: unknown = erreur;
  for (let profondeur = 0; profondeur < 4; profondeur++) {
    if (!courante || typeof courante !== "object") break;
    const e = courante as {
      message?: unknown;
      sqlMessage?: unknown;
      code?: unknown;
      cause?: unknown;
    };
    if (typeof e.message === "string") textes.push(e.message);
    if (typeof e.sqlMessage === "string") textes.push(e.sqlMessage);
    if (typeof e.code === "string") textes.push(e.code);
    courante = e.cause;
  }
  return textes.some(
    (texte) =>
      texte.includes("ER_DUP_ENTRY") || texte.includes("Duplicate entry"),
  );
}

/**
 * Lit le taux d'un jour (défaut : aujourd'hui à Kinshasa), avec le nom de
 * son auteur quand il est retrouvable. Un jour sans taux renvoie `null` :
 * il n'y a rien à convertir, on ne fabrique pas de valeur par défaut.
 */
export async function lireTauxDuJour(
  jour: string = dateDuJourKinshasa(),
): Promise<TauxDuJourLu | null> {
  const lignes = await db
    .select({
      jour: tauxChange.jour,
      valeur: tauxChange.valeur,
      saisiParId: tauxChange.saisiPar,
      saisiParNom: user.name,
    })
    .from(tauxChange)
    .leftJoin(comptesStaff, eq(comptesStaff.id, tauxChange.saisiPar))
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
    .where(eq(tauxChange.jour, jour))
    .limit(1);
  const ligne = lignes[0];
  if (!ligne) return null;
  return {
    jour: ligne.jour,
    valeur: ligne.valeur,
    saisiParId: ligne.saisiParId,
    saisiParNom: ligne.saisiParNom ?? null,
  };
}

/**
 * Saisit le taux d'un jour (défaut : aujourd'hui). Relit d'abord le jour :
 * une valeur identique déjà enregistrée est un no-op idempotent (rejeu d'une
 * écriture hors-ligne, invariant 9) ; une valeur différente est refusée
 * (`DEJA_DEFINI`) — jamais d'écrasement, la correction passe par un taux
 * d'ajustement daté et tracé. L'autorisation est revérifiée ici, à partir du
 * compte réel, jamais de la seule parole de l'appelant.
 */
export async function definirTauxDuJour(input: {
  saisiParId: string;
  valeur: number;
  /** Jour visé, AAAA-MM-JJ. Défaut : aujourd'hui à Kinshasa. */
  jour?: string;
  /** Horloge de l'appareil auteur, conservée telle quelle (offline-first). */
  horodatageLocal?: Date;
  appareilId?: string | null;
}): Promise<{ jour: string; valeur: number }> {
  const compte = await staffParId(input.saisiParId);
  if (!compte) {
    throw new TauxError("NON_AUTORISE", "compte de saisie inconnu");
  }
  if (!(await autoriserSaisieTaux(compte))) {
    throw new TauxError("NON_AUTORISE", "saisie du taux non autorisée");
  }
  if (!valeurTauxValide(input.valeur)) {
    throw new TauxError("VALEUR_INVALIDE", "valeur de taux invalide");
  }
  const jour = input.jour ?? dateDuJourKinshasa();
  if (!jourValide(jour)) {
    throw new TauxError("JOUR_INVALIDE", "jour invalide");
  }
  const horodatageLocal = input.horodatageLocal ?? new Date();

  const existant = await lireTauxDuJour(jour);
  if (existant) {
    if (existant.valeur === input.valeur) {
      return { jour, valeur: existant.valeur };
    }
    throw new TauxError("DEJA_DEFINI", "un taux existe déjà pour ce jour");
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(tauxChange).values({
        id: randomUUID(),
        jour,
        valeur: input.valeur,
        saisiPar: input.saisiParId,
        horodatageLocal,
      });
      const trace = await enregistrerEvenement(
        {
          acteurId: input.saisiParId,
          roleAuMoment: compte.role,
          typeAction: "taux.saisir",
          entite: "taux_change",
          entiteId: jour,
          apres: { jour, valeur: input.valeur },
          horodatageLocal,
          appareilId: input.appareilId ?? null,
        },
        tx,
      );
      if (!trace.ok) {
        throw new TauxError("JOURNAL_INDISPONIBLE", "journal indisponible");
      }
    });
  } catch (erreur) {
    if (erreur instanceof TauxError) throw erreur;
    // Course : deux saisies concurrentes du même jour — la seconde bute sur
    // l'unicité `jour`, on la traduit en refus lisible.
    if (estDoublon(erreur)) {
      throw new TauxError("DEJA_DEFINI", "un taux existe déjà pour ce jour");
    }
    throw erreur;
  }
  return { jour, valeur: input.valeur };
}
