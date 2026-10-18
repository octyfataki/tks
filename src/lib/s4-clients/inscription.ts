import { eq, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import { profilsClients } from "@/lib/db/schema/s4-clients";

export type ProfilCandidat = {
  id: string;
  nom: string;
  contactTelephone: string;
};

/**
 * Comparaison de noms de boutiques : casse, espaces, accents et ponctuation
 * ne portent aucun sens. «Boutique Mukendi», «boutique  mukendi » et
 * «BOUTIQUE-MUKENDI» désignent la même boutique ; deux homonymes réels ne
 * s'effondrent pas, ils ne font que se ressembler.
 */
export function normaliserNomBoutique(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Un profil est candidat s'il porte le **même contact** ou un **nom
 * équivalent**. Aucun champ ne suffit jamais à désigner un profil : ce
 * résultat ouvre une vérification humaine, il n'accorde rien.
 */
export function estProfilCandidat(
  candidat: Pick<ProfilCandidat, "nom" | "contactTelephone">,
  inscription: { nom: string; contactTelephone: string },
): boolean {
  if (candidat.contactTelephone === inscription.contactTelephone) {
    return true;
  }
  const nomCandidat = normaliserNomBoutique(candidat.nom);
  const nomInscrit = normaliserNomBoutique(inscription.nom);
  return nomCandidat.length > 0 && nomCandidat === nomInscrit;
}

/**
 * Ne renvoie que des **identifiants**. Aucun nom, aucun solde, aucune
 * créance ne sort d'ici : la détection ne peut pas divulguer un profil
 * existant, parce qu'elle ne connaît que des clés.
 *
 * La requête porte sur les deux champs **indexés** — contact et nom exact. Le
 * tri plus fin (casse, accents, ponctuation) s'applique ensuite sur ce petit
 * lot. Le critère est volontairement **conservateur** : mieux vaut une
 * vérification humaine de trop qu'un doublon de profil.
 */
export async function detecterProfilsCorrespondants(inscription: {
  nom: string;
  contactTelephone: string;
}): Promise<string[]> {
  const lignes = await db
    .select({
      id: profilsClients.id,
      nom: profilsClients.nom,
      contactTelephone: profilsClients.contactTelephone,
    })
    .from(profilsClients)
    .where(
      or(
        eq(profilsClients.contactTelephone, inscription.contactTelephone),
        eq(profilsClients.nomNormalise, normaliserNomBoutique(inscription.nom)),
      ),
    );

  return lignes
    .filter((profil) => estProfilCandidat(profil, inscription))
    .map((profil) => profil.id);
}

export async function creerProfilNouvelleBoutique(input: {
  compteClientId: string;
  nom: string;
  contactTelephone: string;
  plafondMontant: number;
  plafondDevise: "USD" | "CDF";
  horodatageLocal: Date;
}): Promise<string> {
  const id = randomUUID();
  await db.insert(profilsClients).values({
    id,
    nom: input.nom.trim(),
    nomNormalise: normaliserNomBoutique(input.nom),
    contactTelephone: input.contactTelephone,
    statut: "EN_EVALUATION",
    origine: "INSCRIPTION",
    plafondMontant: input.plafondMontant,
    plafondDevise: input.plafondDevise,
    creePar: input.compteClientId,
    horodatageLocal: input.horodatageLocal,
  });
  return id;
}