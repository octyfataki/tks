import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import { user } from "@/lib/db/schema/auth-schema";
import { aPermission } from "@/lib/authorizations/permissions";
import { enregistrerEvenement } from "@/lib/authorizations/journal";
import { peutTenirTresorerie } from "@/lib/db/schema/authorizations";
import { insertRow } from "@/platform/writes";
import {
  CashError,
  compteLabel,
  prepareAccount,
  prepareMovement,
  prepareTransfer,
  sensCorrection,
  type AccountDraft,
  type CashAccountRow,
  type MovementDraft,
  type MovementView,
  type SourceKind,
  type TransferDraft,
} from "./cash-record";
import { cashAccounts, cashMovements } from "./table";

export { CashError };
export type { MovementView, CashAccountRow, AccountDraft, MovementDraft, TransferDraft };

export type ActeurTresorerie = { id: string; role: string };

function lecteur(ex: ExecuteurDb) {
  return ex
    .select({
      id: cashMovements.id,
      accountId: cashMovements.accountId,
      kind: cashMovements.kind,
      direction: cashMovements.direction,
      category: cashMovements.category,
      amount: cashMovements.amount,
      currency: cashMovements.currency,
      description: cashMovements.description,
      occurredAt: cashMovements.occurredAt,
      sourceKind: cashMovements.sourceKind,
      sourceId: cashMovements.sourceId,
      transferId: cashMovements.transferId,
      correctedOf: cashMovements.correctedOf,
      auteur: user.name,
    })
    .from(cashMovements)
    .leftJoin(comptesStaff, eq(comptesStaff.id, cashMovements.enteredBy))
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId));
}

async function acteurDeSession(): Promise<{
  id: string;
  role: string;
  etat: string;
} | null> {
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
  return lignes[0] ?? null;
}

async function acteurAvecPermission(
  permission: Parameters<typeof aPermission>[1],
): Promise<ActeurTresorerie | null> {
  const moi = await acteurDeSession();
  if (!moi) return null;
  if (!peutTenirTresorerie(moi.role, moi.etat)) return null;
  if (!(await aPermission(moi.id, permission))) return null;
  return { id: moi.id, role: moi.role };
}

export async function peutMouvementer(): Promise<ActeurTresorerie | null> {
  return acteurAvecPermission("tresorerie.mouvement");
}

export async function peutCorriger(): Promise<ActeurTresorerie | null> {
  const moi = await acteurAvecPermission("tresorerie.mouvement");
  if (!moi) return null;
  if (!(await aPermission(moi.id, "ecriture.corriger"))) return null;
  return moi;
}

const HISTORIQUE_LIMITE = 200;

type CompteLigne = {
  id: string;
  type: string;
  network: string;
  currency: string;
  openingAmount: number;
  openedAt: Date;
};

export type CompteAffiche = CompteLigne & {
  label: string;
  solde: number;
};

async function chargerComptes(ex: ExecuteurDb = db): Promise<CompteLigne[]> {
  const lignes = await ex
    .select({
      id: cashAccounts.id,
      type: cashAccounts.type,
      network: cashAccounts.network,
      currency: cashAccounts.currency,
      openingAmount: cashAccounts.openingAmount,
      openedAt: cashAccounts.openedAt,
    })
    .from(cashAccounts)
    .orderBy(cashAccounts.openedAt, cashAccounts.receivedAt);
  return lignes;
}

async function chargersSoldes(
  ex: ExecuteurDb = db,
): Promise<Map<string, number>> {
  const soldes = await ex
    .select({
      accountId: cashMovements.accountId,
      variation: sql<number>`COALESCE(SUM(CASE WHEN ${cashMovements.direction} = 'IN' THEN ${cashMovements.amount} ELSE -${cashMovements.amount} END), 0)`,
    })
    .from(cashMovements)
    .groupBy(cashMovements.accountId);
  return new Map(
    soldes.map((solde) => [solde.accountId, Number(solde.variation ?? 0)]),
  );
}

export async function lireComptes(): Promise<CompteAffiche[]> {
  const [comptes, soldes] = await Promise.all([chargerComptes(), chargersSoldes()]);
  return comptes.map((compte) => ({
    ...compte,
    label: compteLabel(compte),
    solde: compte.openingAmount + (soldes.get(compte.id) ?? 0),
  }));
}

export type MovementLine = MovementView & {
  auteur: string | null;
  compteLabel: string;
};

export type FiltresMouvements = {
  accountId?: string | null;
  du?: Date | null;
  au?: Date | null;
  limite?: number;
};

export async function lireMouvements(
  filtres: FiltresMouvements = {},
): Promise<MovementLine[]> {
  const conditions = [];
  if (filtres.accountId) {
    conditions.push(eq(cashMovements.accountId, filtres.accountId));
  }
  if (filtres.du) conditions.push(gte(cashMovements.occurredAt, filtres.du));
  if (filtres.au) conditions.push(lte(cashMovements.occurredAt, filtres.au));
  const lignes = await lecteur(db)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(cashMovements.occurredAt), desc(cashMovements.receivedAt))
    .limit(filtres.limite ?? HISTORIQUE_LIMITE);
  const comptes = await chargerComptes();
  const parId = new Map(comptes.map((c) => [c.id, c]));
  return lignes.map((ligne) => {
    const compte = parId.get(ligne.accountId);
    return {
      ...ligne,
      compteLabel: compte ? compteLabel(compte) : ligne.accountId,
    };
  });
}

export type FluxCompte = { entrees: number; sorties: number };

export type TotalsCategorie = {
  categorie: string;
  entrees: number;
  sorties: number;
};

export type TotalsDevise = {
  devise: string;
  entrees: number;
  sorties: number;
  categories: TotalsCategorie[];
  transferts: number;
};

export type TotauxPeriode = { parDevise: TotalsDevise[] };

export async function lireTotaux(
  du: Date,
  au: Date,
): Promise<TotauxPeriode> {
  const bornes = and(
    gte(cashMovements.occurredAt, du),
    lte(cashMovements.occurredAt, au),
  );
  const lignes = await db
    .select({
      category: cashMovements.category,
      currency: cashMovements.currency,
      entrees: sql<number>`COALESCE(SUM(CASE WHEN ${cashMovements.direction} = 'IN' THEN ${cashMovements.amount} ELSE 0 END), 0)`,
      sorties: sql<number>`COALESCE(SUM(CASE WHEN ${cashMovements.direction} = 'OUT' THEN ${cashMovements.amount} ELSE 0 END), 0)`,
    })
    .from(cashMovements)
    .where(bornes)
    .groupBy(cashMovements.category, cashMovements.currency);
  const ordre = new Map<string, TotalsDevise>();
  for (const ligne of lignes) {
    const carton =
      ordre.get(ligne.currency) ??
      { devise: ligne.currency, entrees: 0, sorties: 0, categories: [], transferts: 0 };
    const entreesLigne = Number(ligne.entrees ?? 0);
    const sortiesLigne = Number(ligne.sorties ?? 0);
    if (ligne.category === "TRANSFER") {
      carton.transferts += entreesLigne + sortiesLigne;
    } else {
      carton.entrees += entreesLigne;
      carton.sorties += sortiesLigne;
      carton.categories.push({
        categorie: ligne.category,
        entrees: entreesLigne,
        sorties: sortiesLigne,
      });
    }
    ordre.set(ligne.currency, carton);
  }
  return { parDevise: [...ordre.values()] };
}

async function compteParId(  ex: ExecuteurDb,
  id: string,
): Promise<CompteLigne | null> {
  const lignes = await ex
    .select({
      id: cashAccounts.id,
      type: cashAccounts.type,
      network: cashAccounts.network,
      currency: cashAccounts.currency,
      openingAmount: cashAccounts.openingAmount,
      openedAt: cashAccounts.openedAt,
    })
    .from(cashAccounts)
    .where(eq(cashAccounts.id, id))
    .limit(1);
  return lignes[0] ?? null;
}

export type CompteOuvert = CompteLigne & { label: string };

export async function ouvrirCompte(
  draft: AccountDraft,
): Promise<CompteOuvert> {
  const acteur = await peutMouvementer();
  if (!acteur) {
    throw new CashError(
      "NOT_ALLOWED",
      "Enregistrer un mouvement de trésorerie exige la permission tresorerie.mouvement.",
    );
  }
  const prepare = prepareAccount(draft);
  return db.transaction(async (tx) => {
    if (prepare.type === "CASH") {
      const existante = await tx
        .select({ id: cashAccounts.id })
        .from(cashAccounts)
        .where(eq(cashAccounts.type, "CASH"))
        .limit(1);
      if (existante.length > 0) {
        throw new CashError(
          "ACCOUNT_EXISTS",
          "La caisse existe déjà : une seule caisse physique.",
        );
      }
    }
    const id = randomUUID();
    await insertRow(tx, cashAccounts, {
      id,
      type: prepare.type,
      network: prepare.network,
      currency: prepare.currency,
      openingAmount: prepare.openingAmount,
      openedAt: prepare.openedAt,
      openedBy: acteur.id,
      deviceId: prepare.deviceId,
    });
    const trace = await enregistrerEvenement(
      {
        acteurId: acteur.id,
        roleAuMoment: acteur.role,
        typeAction: "cash.movement",
        entite: "cash_account",
        entiteId: id,
        apres: {
          type: prepare.type,
          network: prepare.network,
          currency: prepare.currency,
          openingAmount: prepare.openingAmount,
        },
        horodatageLocal: prepare.openedAt,
        appareilId: prepare.deviceId,
      },
      tx,
    );
    if (!trace.ok) {
      throw new CashError(
        "AUDIT_UNAVAILABLE",
        "Journal indisponible : ouverture annulée.",
      );
    }
    return {
      id,
      type: prepare.type,
      network: prepare.network,
      currency: prepare.currency,
      openingAmount: prepare.openingAmount,
      openedAt: prepare.openedAt,
      label: compteLabel(prepare),
    };
  });
}

export type MovementEnregistre = { id: string; soldePlus: number };

export async function enregistrerMouvement(
  draft: MovementDraft,
): Promise<MovementEnregistre> {
  const acteur = await peutMouvementer();
  if (!acteur) {
    throw new CashError(
      "NOT_ALLOWED",
      "Enregistrer un mouvement de trésorerie exige la permission tresorerie.mouvement.",
    );
  }
  return db.transaction(async (tx) => {
    const compte = await compteParId(tx, String(draft.accountId ?? ""));
    if (!compte) {
      throw new CashError("ACCOUNT_UNKNOWN", "Compte de trésorerie introuvable.");
    }
    const prepare = prepareMovement(draft, compte);
    const id = randomUUID();
    await insertRow(tx, cashMovements, {
      id,
      accountId: prepare.accountId,
      kind: "OPERATION",
      direction: prepare.direction,
      category: prepare.category,
      amount: prepare.amount,
      currency: prepare.currency,
      description: prepare.description,
      occurredAt: prepare.occurredAt,
      enteredBy: acteur.id,
      sourceKind: "MANUAL" satisfies SourceKind,
      deviceId: prepare.deviceId,
    });
    const trace = await enregistrerEvenement(
      {
        acteurId: acteur.id,
        roleAuMoment: acteur.role,
        typeAction: "cash.movement",
        entite: "cash_movement",
        entiteId: id,
        apres: {
          accountId: prepare.accountId,
          direction: prepare.direction,
          category: prepare.category,
          amount: prepare.amount,
          currency: prepare.currency,
          description: prepare.description,
          sourceKind: "MANUAL",
        },
        horodatageLocal: prepare.occurredAt,
        appareilId: prepare.deviceId,
      },
      tx,
    );
    if (!trace.ok) {
      throw new CashError(
        "AUDIT_UNAVAILABLE",
        "Journal indisponible : mouvement annulé.",
      );
    }
    return {
      id,
      soldePlus:
        prepare.direction === "IN" ? prepare.amount : -prepare.amount,
    };
  });
}

export type TransfertEnregistre = {
  transferId: string;
  sortieId: string;
  entreeId: string;
};

export async function transferer(
  draft: TransferDraft,
): Promise<TransfertEnregistre> {
  const acteur = await peutMouvementer();
  if (!acteur) {
    throw new CashError(
      "NOT_ALLOWED",
      "Enregistrer un transfert exige la permission tresorerie.mouvement.",
    );
  }
  const prepare = prepareTransfer(draft);
  const transferId = randomUUID();
  const sortieId = randomUUID();
  const entreeId = randomUUID();
  await db.transaction(async (tx) => {
    const [depart, arrivee] = await Promise.all([
      compteParId(tx, prepare.fromAccountId),
      compteParId(tx, prepare.toAccountId),
    ]);
    if (!depart || !arrivee) {
      throw new CashError("ACCOUNT_UNKNOWN", "Compte de transfert introuvable.");
    }
    if (depart.currency !== prepare.currency || arrivee.currency !== prepare.currency) {
      throw new CashError(
        "CURRENCY_MISMATCH",
        "Un transfert relie deux comptes tenus dans la même devise.",
      );
    }
    await insertRow(tx, cashMovements, {
      id: sortieId,
      accountId: prepare.fromAccountId,
      kind: "OPERATION",
      direction: "OUT",
      category: "TRANSFER",
      amount: prepare.amount,
      currency: prepare.currency,
      description: prepare.description,
      occurredAt: prepare.occurredAt,
      enteredBy: acteur.id,
      sourceKind: "MANUAL",
      transferId,
      deviceId: prepare.deviceId,
    });
    await insertRow(tx, cashMovements, {
      id: entreeId,
      accountId: prepare.toAccountId,
      kind: "OPERATION",
      direction: "IN",
      category: "TRANSFER",
      amount: prepare.amount,
      currency: prepare.currency,
      description: prepare.description,
      occurredAt: prepare.occurredAt,
      enteredBy: acteur.id,
      sourceKind: "MANUAL",
      transferId,
      deviceId: prepare.deviceId,
    });
    const trace = await enregistrerEvenement(
      {
        acteurId: acteur.id,
        roleAuMoment: acteur.role,
        typeAction: "cash.movement",
        entite: "cash_transfer",
        entiteId: transferId,
        apres: {
          fromAccountId: prepare.fromAccountId,
          toAccountId: prepare.toAccountId,
          amount: prepare.amount,
          currency: prepare.currency,
          sortieId,
          entreeId,
        },
        horodatageLocal: prepare.occurredAt,
        appareilId: prepare.deviceId,
      },
      tx,
    );
    if (!trace.ok) {
      throw new CashError(
        "AUDIT_UNAVAILABLE",
        "Journal indisponible : transfert annulé.",
      );
    }
  });
  return { transferId, sortieId, entreeId };
}

export type CorrectionPosee = { corrections: { id: string; compte: string }[] };

export async function corriger(
  mouvementId: string,
  motif: string,
): Promise<CorrectionPosee> {
  const leMotif = motif.trim();
  if (leMotif === "") {
    throw new CashError(
      "MOTIF_REQUIRED",
      "Une correction exige un motif : une correction sans motif est une suppression maquillée.",
    );
  }
  const acteur = await peutCorriger();
  if (!acteur) {
    throw new CashError(
      "NOT_ALLOWED",
      "Corriger une écriture exige tresorerie.mouvement et ecriture.corriger.",
    );
  }
  const maintenant = new Date();
  return db.transaction(async (tx) => {
    const originaux = await tx
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.id, mouvementId))
      .limit(1);
    const original = originaux[0];
    if (!original) {
      throw new CashError("CORRECTION_IMPOSSIBLE", "Mouvement introuvable.");
    }
    if (original.kind !== "OPERATION") {
      throw new CashError(
        "CORRECTION_IMPOSSIBLE",
        "Une correction se corrige par une correction, jamais par un mouvement.",
      );
    }
    let visees = [original];
    if (original.transferId) {
      const jambe = await tx
        .select()
        .from(cashMovements)
        .where(eq(cashMovements.transferId, original.transferId));
      visees = jambe.sort((a) => (a.id === original.id ? -1 : 1));
    }
    if (visees.some((visee) => visee.correctedOf !== null)) {
      throw new CashError(
        "ALREADY_CORRECTED",
        "Ce mouvement est déjà corrigé.",
      );
    }
    const posees: { id: string; compte: string }[] = [];
    for (const visee of visees) {
      const id = randomUUID();
      await insertRow(tx, cashMovements, {
        id,
        accountId: visee.accountId,
        kind: "CORRECTION",
        direction: sensCorrection(visee.direction),
        category: visee.category,
        amount: visee.amount,
        currency: visee.currency,
        description: `Correction de ${visee.id} : ${leMotif}`.slice(0, 400),
        occurredAt: maintenant,
        enteredBy: acteur.id,
        sourceKind: "MANUAL",
        correctedOf: visee.id,
      });
      posees.push({ id, compte: visee.accountId });
    }
    const trace = await enregistrerEvenement(
      {
        acteurId: acteur.id,
        roleAuMoment: acteur.role,
        typeAction: "entry.correct",
        entite: "cash_movement",
        entiteId: original.id,
        avant: visees.map((visee) => ({
          id: visee.id,
          accountId: visee.accountId,
          direction: visee.direction,
          category: visee.category,
          amount: visee.amount,
        })),
        apres: posees,
        motif: leMotif,
        horodatageLocal: maintenant,
      },
      tx,
    );
    if (!trace.ok) {
      throw new CashError(
        "AUDIT_UNAVAILABLE",
        "Journal indisponible : correction annulée.",
      );
    }
    return { corrections: posees };
  });
}

export type EntreeClientInput = {
  sourceId: string;
  mode: "CASH" | "MOBILE_MONEY";
  reseau?: string | null;
  montant: number;
  devise: string;
  horodatageLocal?: Date;
  auteurId: string;
  roleAuMoment: string;
  appareilId?: string | null;
};

export type EntreeClientResult =
  | { cree: true; mouvementId: string }
  | { cree: false; raison: "COMPTE_INDETERMINE" | "DEJA_ENREGISTREE" };

export async function enregistrerEntreeClient(
  entree: EntreeClientInput,
): Promise<EntreeClientResult> {
  const duService = entree.horodatageLocal ?? new Date();
  return db.transaction(async (tx) => {
    const deja = await tx
      .select({ id: cashMovements.id })
      .from(cashMovements)
      .where(
        and(
          eq(cashMovements.sourceKind, "AUTOMATIC"),
          eq(cashMovements.sourceId, entree.sourceId),
          eq(cashMovements.category, "SALE"),
        ),
      )
      .limit(1);
    if (deja.length > 0) {
      return { cree: false, raison: "DEJA_ENREGISTREE" as const };
    }
    const comptes = await chargerComptes(tx);
    const compte =
      entree.mode === "CASH"
        ? comptes.find(
            (candidat) =>
              candidat.type === "CASH" && candidat.currency === entree.devise,
          )
        : comptes.find(
            (candidat) =>
              candidat.type === "ELECTRONIC_MONEY" &&
              candidat.network === entree.reseau &&
              candidat.currency === entree.devise,
          );
    if (!compte) {
      return { cree: false, raison: "COMPTE_INDETERMINE" as const };
    }
    const id = randomUUID();
    await insertRow(tx, cashMovements, {
      id,
      accountId: compte.id,
      kind: "OPERATION",
      direction: "IN",
      category: "SALE",
      amount: entree.montant,
      currency: entree.devise,
      occurredAt: duService,
      enteredBy: entree.auteurId,
      sourceKind: "AUTOMATIC",
      sourceId: entree.sourceId,
      deviceId: entree.appareilId ?? null,
    });
    const trace = await enregistrerEvenement(
      {
        acteurId: entree.auteurId,
        roleAuMoment: entree.roleAuMoment,
        typeAction: "cash.movement",
        entite: "cash_movement",
        entiteId: id,
        apres: {
          accountId: compte.id,
          direction: "IN",
          category: "SALE",
          amount: entree.montant,
          currency: entree.devise,
          sourceKind: "AUTOMATIC",
          sourceId: entree.sourceId,
        },
        horodatageLocal: duService,
        appareilId: entree.appareilId ?? null,
      },
      tx,
    );
    if (!trace.ok) {
      throw new CashError(
        "AUDIT_UNAVAILABLE",
        "Journal indisponible : entrée automatique annulée.",
      );
    }
    return { cree: true, mouvementId: id };
  });
}

export type ConsoleTresorerie = {
  comptes: CompteAffiche[];
  mouvements: MovementLine[];
  totaux: TotauxPeriode;
};

export async function lireConsoleTresorerie(
  filtres: FiltresMouvements = {},
): Promise<ConsoleTresorerie> {
  const [comptes, mouvements, totaux] = await Promise.all([
    lireComptes(),
    lireMouvements(filtres),
    lireTotaux(jourDebut(new Date()), jourFin(new Date())),
  ]);
  return { comptes, mouvements, totaux };
}

function jourDebut(instant: Date): Date {
  return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
}

function jourFin(instant: Date): Date {
  return new Date(
    instant.getFullYear(),
    instant.getMonth(),
    instant.getDate(),
    23,
    59,
    59,
    999,
  );
}

export async function lireCorrigibles(
  limite: number = HISTORIQUE_LIMITE,
): Promise<(MovementLine & { transfertLie: boolean })[]> {
  const lignes = await lecteur(db)
    .where(
      and(
        eq(cashMovements.kind, "OPERATION"),
        isNull(cashMovements.correctedOf),
      ),
    )
    .orderBy(desc(cashMovements.occurredAt), desc(cashMovements.receivedAt))
    .limit(limite);
  const comptes = await chargerComptes();
  const parId = new Map(comptes.map((c) => [c.id, c]));
  return lignes.map((ligne) => {
    const compte = parId.get(ligne.accountId);
    return {
      ...ligne,
      transfertLie: ligne.transferId !== null,
      compteLabel: compte ? compteLabel(compte) : ligne.accountId,
    };
  });
}

