import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  DEFAUT_DUREE_INVITATION_JOURS,
  DEFAUT_PLAFOND_CLIENT_MONTANT,
  estCleReglage,
  normaliserDureeInvitationJours,
  normaliserPlafondClientDevise,
  normaliserPlafondClientMontant,
  peutModifierReglage,
  reglages,
  type CleReglage,
  type DevisePlafondClient,
} from "@/lib/db/schema/s1-comptes";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";
import { StaffError } from "./staff";

const VALEURS_DEFAUT: Record<CleReglage, string> = {
  duree_invitation_jours: String(DEFAUT_DUREE_INVITATION_JOURS),
  plafond_client_defaut_montant: String(DEFAUT_PLAFOND_CLIENT_MONTANT),
  plafond_client_defaut_devise: "USD",
};

export type PlafondClientDefaut = {
  montant: number;
  devise: DevisePlafondClient;
};

export async function lirePlafondClientDefaut(): Promise<PlafondClientDefaut> {
  const [montant, devise] = await Promise.all([
    lireReglage("plafond_client_defaut_montant"),
    lireReglage("plafond_client_defaut_devise"),
  ]);
  return {
    montant: normaliserPlafondClientMontant(montant),
    devise: normaliserPlafondClientDevise(devise),
  };
}

export async function lireReglage(cle: CleReglage): Promise<string> {
  const lignes = await db
    .select({ valeur: reglages.valeur })
    .from(reglages)
    .where(eq(reglages.cle, cle));
  return lignes[0]?.valeur ?? VALEURS_DEFAUT[cle];
}

export async function lireDureeInvitationJours(): Promise<number> {
  return normaliserDureeInvitationJours(
    await lireReglage("duree_invitation_jours"),
  );
}

export async function definirReglage(input: {
  cle: string;
  valeur: string;
  modifieParRole: string;
  modifieParEtat: string;
  modifieParId: string;
}): Promise<{ cle: CleReglage; valeur: string }> {
  if (!estCleReglage(input.cle)) {
    throw new StaffError("NON_AUTORISE", "réglage inconnu");
  }
  if (
    !peutModifierReglage(input.cle, input.modifieParRole, input.modifieParEtat)
  ) {
    throw new StaffError("NON_AUTORISE", "modificateur non autorisé");
  }
  const valeur =
    input.cle === "duree_invitation_jours"
      ? String(normaliserDureeInvitationJours(input.valeur))
      : input.cle === "plafond_client_defaut_montant"
        ? String(normaliserPlafondClientMontant(input.valeur))
        : input.cle === "plafond_client_defaut_devise"
          ? normaliserPlafondClientDevise(input.valeur)
          : input.valeur;
  const avant = await lireReglage(input.cle);
  await db.transaction(async (tx) => {
    await tx
      .insert(reglages)
      .values({ cle: input.cle, valeur, modifiePar: input.modifieParId })
      .onDuplicateKeyUpdate({
        set: { valeur, modifiePar: input.modifieParId },
      });
    const trace = await enregistrerEvenement(
      {
        acteurId: input.modifieParId,
        roleAuMoment: input.modifieParRole,
        typeAction: "reglage.modifier",
        entite: "reglage",
        entiteId: input.cle,
        avant: { valeur: avant },
        apres: { valeur },
      },
      tx,
    );
    if (!trace.ok) {
      throw new StaffError("JOURNAL_INDISPONIBLE", "journal indisponible");
    }
  });
  return { cle: input.cle, valeur };
}
