import { headers } from "next/headers";
import { and, desc, eq, like, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import { peutOuvrirDossier } from "@/lib/db/schema/authorizations/validation";
import { aPermission } from "@/lib/authorizations/permissions";
import { enregistrerEvenement } from "@/lib/authorizations/journal";
import {
  DossierError,
  echapperLike,
  preparerCreationDossier,
  type CreationDossier,
  type DossierResume,
} from "./dossier";
import { dossiersClients } from "./table";

export { DossierError };
export type { CreationDossier, DossierResume };

// Module clients — persistance des dossiers. Seul fichier du module qui
// écrit en base (dette P0 assumée, purge P1 : la porte d'écriture
// unique absorbera cet insert). Toute création embarque sa trace
// d'audit dans la même transaction : journal indisponible = annulée.

export type ActeurDossier = { id: string; role: string };

async function lireMoi(): Promise<ActeurDossier | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const moi = lignes[0];
  if (!moi || moi.etat !== "VALIDE") return null;
  if (peutOuvrirDossier(moi.role, moi.etat)) return { id: moi.id, role: moi.role };
  if (await aPermission(moi.id, "dossier.creer")) return { id: moi.id, role: moi.role };
  return null;
}

/**
 * Acteur autorisé à ouvrir un dossier, ou `null`. Jamais un client :
 * sans ligne staff, aucun dossier ne s'ouvre — c'est le geste qui
 * donnerait à un inconnu la dette d'autrui.
 */
export async function acteurPeutOuvrirDossier(): Promise<ActeurDossier | null> {
  return lireMoi();
}

export type DossierCree = {
  id: string;
  nom: string;
  contact: string;
  adresse: string;
  /** Dossiers existants qui portent déjà ce contact : on les affiche, on ne fusionne jamais. */
  partagentContact: DossierResume[];
};

/**
 * Ouvre un dossier client : une ligne, sa trace `dossier.creer`, une
 * seule transaction. Un contact déjà porté par d'autres dossiers est
 * accepté — les dossiers existants sont renvoyés pour affichage, jamais
 * retenus automatiquement.
 */
export async function creerDossier(entree: CreationDossier): Promise<DossierCree> {
  const prepare = preparerCreationDossier(entree);
  const acteur = await lireMoi();
  if (!acteur) {
    throw new DossierError(
      "NON_AUTORISE",
      "Ouvrir un dossier exige un distributeur ou un agent autorisé.",
    );
  }
  return db.transaction(async (tx) => {
    const partagent = await tx
      .select({
        id: dossiersClients.id,
        nom: dossiersClients.nom,
        contact: dossiersClients.contact,
        adresse: dossiersClients.adresse,
      })
      .from(dossiersClients)
      .where(eq(dossiersClients.contact, prepare.contact));
    await tx.insert(dossiersClients).values({
      id: prepare.id,
      nom: prepare.nom,
      contact: prepare.contact,
      adresse: prepare.adresse,
      creePar: acteur.id,
      horodatageLocal: prepare.horodatageLocal,
    });
    const trace = await enregistrerEvenement(
      {
        acteurId: acteur.id,
        roleAuMoment: acteur.role,
        typeAction: "dossier.creer",
        entite: "dossier_client",
        entiteId: prepare.id,
        apres: {
          nom: prepare.nom,
          contact: prepare.contact,
          adresse: prepare.adresse,
        },
      },
      tx,
    );
    if (!trace.ok) {
      throw new DossierError(
        "JOURNAL_INDISPONIBLE",
        "Journal indisponible : création annulée.",
      );
    }
    return {
      id: prepare.id,
      nom: prepare.nom,
      contact: prepare.contact,
      adresse: prepare.adresse,
      partagentContact: partagent,
    };
  });
}

const RESULTATS_MAX = 20;

/**
 * Retrouve des dossiers par nom, contact ou adresse — plusieurs champs à
 * la fois. Réservé au personnel validé : un client ne liste jamais les
 * dossiers des autres (le rattachement viendra en S4-02).
 */
export async function rechercherDossiers(recherche: string): Promise<DossierResume[]> {
  const moi = await lireMoi();
  if (!moi) return [];
  const termes = recherche.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  const lignes = await db
    .select({
      id: dossiersClients.id,
      nom: dossiersClients.nom,
      contact: dossiersClients.contact,
      adresse: dossiersClients.adresse,
    })
    .from(dossiersClients)
    .where(
      termes.length === 0
        ? undefined
        : and(
            ...termes.map((terme) => {
              const motif = `%${echapperLike(terme)}%`;
              return or(
                like(dossiersClients.nom, motif),
                like(dossiersClients.contact, motif),
                like(dossiersClients.adresse, motif),
              );
            }),
          ),
    )
    .orderBy(desc(dossiersClients.recuLe))
    .limit(RESULTATS_MAX);
  return lignes;
}
