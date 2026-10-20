import { randomUUID } from "node:crypto";
import { desc, eq, lte } from "drizzle-orm";
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
  | "INCHANGE"
  | "JOURNAL_INDISPONIBLE";

export class TauxError extends Error {
  code: ErreurTaux;
  constructor(code: ErreurTaux, message: string) {
    super(message);
    this.code = code;
  }
}

export type TauxEnVigueurLu = {
  numero: number;
  jour: string;
  valeur: number;
  saisiParId: string | null;
  saisiParNom: string | null;
};

const CHAMPS_LUS = {
  numero: tauxChange.numero,
  jour: tauxChange.jour,
  valeur: tauxChange.valeur,
  saisiParId: tauxChange.saisiPar,
  saisiParNom: user.name,
};

const JOINTURES = () =>
  db
    .select(CHAMPS_LUS)
    .from(tauxChange)
    .leftJoin(comptesStaff, eq(comptesStaff.id, tauxChange.saisiPar))
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId));

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

export async function lireTauxEnVigueur(): Promise<TauxEnVigueurLu | null> {
  const lignes = await JOINTURES().orderBy(desc(tauxChange.numero)).limit(1);
  return lignes[0] ?? null;
}

export async function lireTauxEnVigueurAu(
  jour: string,
): Promise<TauxEnVigueurLu | null> {
  if (!jourValide(jour)) {
    throw new TauxError("JOUR_INVALIDE", "jour invalide");
  }
  const lignes = await JOINTURES()
    .where(lte(tauxChange.jour, jour))
    .orderBy(desc(tauxChange.numero))
    .limit(1);
  return lignes[0] ?? null;
}

export async function lireHistoriqueTaux(
  plafond: number = 10,
): Promise<TauxEnVigueurLu[]> {
  return JOINTURES()
    .orderBy(desc(tauxChange.numero))
    .limit(Math.min(Math.max(plafond, 1), 100));
}

type SaisieValidee = { jour: string; horodatageLocal: Date };

async function validerSaisie(
  input: {
    saisiParId: string;
    valeur: number;
    jour?: string;
    horodatageLocal?: Date;
  },
  compte: CompteStaffMinimal,
): Promise<SaisieValidee> {
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
  return { jour, horodatageLocal: input.horodatageLocal ?? new Date() };
}

export async function enregistrerTaux(input: {
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
  const { jour, horodatageLocal } = await validerSaisie(input, compte);

  const enVigueur = await lireTauxEnVigueur();
  if (enVigueur && enVigueur.valeur === input.valeur) {
    throw new TauxError("INCHANGE", "ce taux est déjà en vigueur");
  }

  return db.transaction(async (tx) => {
    const dernier = await tx
      .select({ numero: tauxChange.numero })
      .from(tauxChange)
      .orderBy(desc(tauxChange.numero))
      .limit(1)
      .for("update");
    const numero = (dernier[0]?.numero ?? 0) + 1;

    const id = randomUUID();
    await tx.insert(tauxChange).values({
      id,
      numero,
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
        entiteId: id,
        apres: { jour, valeur: input.valeur },
        horodatageLocal,
        appareilId: input.appareilId ?? null,
      },
      tx,
    );
    if (!trace.ok) {
      throw new TauxError("JOURNAL_INDISPONIBLE", "journal indisponible");
    }
    return { jour, valeur: input.valeur };
  });
}
