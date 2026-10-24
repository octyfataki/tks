import { randomUUID } from "node:crypto";
import { eq, like, or } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { profilsClients } from "@/lib/db/schema/clients";
import { insertRow } from "@/platform/writes";
import { staffActorWith } from "@/lib/authorizations/staff-actor";
import { enregistrerEvenement } from "@/lib/authorizations/journal";
import {
  DEFAULT_PROFILE_CURRENCY,
  DEFAULT_PROFILE_STATUS,
  normalizePhone,
  prepareCounterProfile,
  ProfileError,
  type ProfileSummary,
} from "./profile-record";

export { ProfileError };
export type { ProfileSummary };

const COLUMNS = {
  id: profilsClients.id,
  name: profilsClients.nom,
  phone: profilsClients.contactTelephone,
  status: profilsClients.statut,
  limitAmount: profilsClients.plafondMontant,
  limitCurrency: profilsClients.plafondDevise,
};

type ProfileRow = {
  id: string;
  name: string;
  phone: string;
  status: string;
  limitAmount: number;
  limitCurrency: number | string;
};

function toSummary(row: ProfileRow): ProfileSummary {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    status: row.status,
    limitAmount: Number(row.limitAmount),
    limitCurrency: String(row.limitCurrency),
  };
}

export async function searchProfiles(
  query: string,
  limit: number = 20,
): Promise<ProfileSummary[]> {
  const terme = query.trim();
  if (terme === "") return [];
  const phone = normalizePhone(terme);
  const lignes = await db
    .select(COLUMNS)
    .from(profilsClients)
    .where(
      or(
        eq(profilsClients.contactTelephone, phone),
        like(profilsClients.nom, `%${terme}%`),
      ),
    )
    .limit(limit);
  return lignes.map(toSummary);
}

export async function readProfile(
  profileId: string,
  ex: ExecuteurDb = db,
): Promise<ProfileSummary | null> {
  const lignes = await ex
    .select(COLUMNS)
    .from(profilsClients)
    .where(eq(profilsClients.id, profileId))
    .limit(1);
  return lignes[0] ? toSummary(lignes[0]) : null;
}

export async function requireProfile(
  profileId: string,
): Promise<ProfileSummary> {
  const profile = await readProfile(profileId);
  if (!profile) {
    throw new ProfileError("NOT_FOUND", "Profil client introuvable.");
  }
  return profile;
}

export async function ensureCounterProfile(input: {
  name: unknown;
  phone: unknown;
  address?: unknown;
}): Promise<ProfileSummary> {
  const actor = await staffActorWith("dossier.creer");
  if (!actor) {
    throw new ProfileError(
      "NOT_AUTHORIZED",
      "Créer un profil au comptoir exige la permission « dossier.creer ».",
    );
  }
  const prepared = prepareCounterProfile(input);
  const existants = await db
    .select(COLUMNS)
    .from(profilsClients)
    .where(eq(profilsClients.contactTelephone, prepared.phone));
  const id = randomUUID();
  const instant = new Date();
  await db.transaction(async (ex) => {
    await insertRow(ex, profilsClients, {
      id,
      nom: prepared.name,
      adresse: prepared.address,
      contactTelephone: prepared.phone,
      statut: DEFAULT_PROFILE_STATUS,
      plafondMontant: 0,
      plafondDevise: DEFAULT_PROFILE_CURRENCY,
      creePar: actor.id,
      horodatageLocal: instant,
    });
    const trace = await enregistrerEvenement(
      {
        acteurId: actor.id,
        roleAuMoment: actor.role,
        typeAction: "profil.creer",
        entite: "profil_client",
        entiteId: id,
        avant:
          existants.length > 0
            ? {
                profilsPartages: existants.map((existant) => ({
                  id: existant.id,
                  nom: existant.name,
                })),
              }
            : undefined,
        apres: {
          nom: prepared.name,
          contactTelephone: prepared.phone,
          plafondMontant: 0,
          plafondDevise: DEFAULT_PROFILE_CURRENCY,
        },
        horodatageLocal: instant,
      },
      ex,
    );
    if (!trace.ok) {
      throw new ProfileError(
        "AUDIT_UNAVAILABLE",
        "Journal indisponible : le profil n'est pas créé.",
      );
    }
  });
  return {
    id,
    name: prepared.name,
    phone: prepared.phone,
    status: DEFAULT_PROFILE_STATUS,
    limitAmount: 0,
    limitCurrency: DEFAULT_PROFILE_CURRENCY,
  };
}
