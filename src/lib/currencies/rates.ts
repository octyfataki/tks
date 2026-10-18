import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesStaff } from "@/lib/db/schema/accounts";
import {
  dateDuJourKinshasa,
  jourValide,
  rolePeutSaisirTaux,
  tauxChange,
  valeurTauxValide,
} from "@/lib/db/schema/currencies";
import { aPermission } from "@/lib/authorizations/permissions";
import { enregistrerEvenement } from "@/lib/authorizations/journal";

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

export type TauxDuJourLu = {
  jour: string;
  valeur: number;
  saisiParId: string | null;
  saisiParNom: string | null;
};

type CompteStaffMinimal = { id: string; role: string; etat: string };

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

export async function definirTauxDuJour(input: {
  saisiParId: string;
  valeur: number;
  jour?: string;
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
    if (estDoublon(erreur)) {
      throw new TauxError("DEJA_DEFINI", "un taux existe déjà pour ce jour");
    }
    throw erreur;
  }
  return { jour, valeur: input.valeur };
}
