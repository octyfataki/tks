import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  comptesClients,
  normaliserEmailStaff,
  normaliserTelephoneClient,
} from "@/lib/db/schema/s1-comptes";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";
import { inscrireUtilisateur, StaffError } from "./staff";

// Couche applicative clients (S1-01) : inscription publique d'un compte
// client. L'inscription crée un compte EN_ATTENTE_VALIDATION qui ne peut
// rien faire — ni dossier, ni solde, ni commande, pas même prépayée.
// La validation humaine sur pièce d'identité arrive en S1-03.

export type ErreurClient =
  | "NON_AUTORISE"
  | "EMAIL_DEJA_UTILISE"
  | "TELEPHONE_DEJA_UTILISE"
  | "EMAIL_INVALIDE"
  | "TELEPHONE_INVALIDE"
  | "MOT_DE_PASSE_INVALIDE"
  | "NOM_INVALIDE"
  | "JOURNAL_INDISPONIBLE";

export class ClientError extends Error {
  code: ErreurClient;
  constructor(code: ErreurClient, message: string) {
    super(message);
    this.code = code;
  }
}

/** Distingue le doublon téléphone du doublon email (unicités MySQL). */
function estDoublonTelephone(erreur: unknown): boolean {
  return messagesErreurMysql(erreur).some((texte) =>
    texte.toLowerCase().includes("telephone"),
  );
}

/**
 * Textes d'une erreur MySQL à travers l'enveloppe Drizzle : Drizzle lance
 * `DrizzleQueryError` (« Failed query: … ») avec l'erreur driver en
 * `cause` — le code ER_DUP_ENTRY et le nom de la clé vivent en dessous.
 */
function messagesErreurMysql(erreur: unknown, profondeur = 0): string[] {
  if (!erreur || typeof erreur !== "object" || profondeur > 3) return [];
  const e = erreur as {
    message?: unknown;
    sqlMessage?: unknown;
    code?: unknown;
    cause?: unknown;
  };
  const textes: string[] = [];
  if (typeof e.message === "string") textes.push(e.message);
  if (typeof e.sqlMessage === "string") textes.push(e.sqlMessage);
  if (typeof e.code === "string") textes.push(e.code);
  textes.push(...messagesErreurMysql(e.cause, profondeur + 1));
  return textes;
}

function estDoublonMysql(erreur: unknown): boolean {
  return messagesErreurMysql(erreur).some(
    (texte) =>
      texte.includes("ER_DUP_ENTRY") || texte.includes("Duplicate entry"),
  );
}

/**
 * Inscription publique d'un client : utilisateur auth + compte client
 * EN_ATTENTE_VALIDATION dans une seule transaction — jamais d'orphelin.
 * L'écriture passe par la server action dédiée, jamais par le endpoint
 * public /sign-up/email (bloqué par le proxy, rate-limité, auto-sign-in).
 *
 * Règles (S1-01) : email valide et unique, téléphone valide et unique —
 * une seconde inscription avec le même numéro est refusée —, mot de passe
 * d'au moins 8 caractères, nom exigé. `id` optionnel : identifiant généré
 * sur l'appareil pour la future file hors-ligne (S8) ; défaut = UUID serveur.
 * L'inscription est journalisée (S2, invariant 8), échec fermé : si le
 * journal échoue, l'inscription entière est annulée.
 */
export async function inscrireClient(input: {
  email: string;
  password: string;
  name: string;
  telephone: string;
  id?: string;
}) {
  const nom = input.name.trim();
  if (nom.length < 2 || nom.length > 255) {
    throw new ClientError("NOM_INVALIDE", "nom exigé");
  }
  if (input.password.length < 8) {
    throw new ClientError(
      "MOT_DE_PASSE_INVALIDE",
      "mot de passe trop court",
    );
  }
  const emailNormalise = normaliserEmailStaff(input.email);
  if (!emailNormalise) {
    throw new ClientError("EMAIL_INVALIDE", "adresse email invalide");
  }
  const telephone = normaliserTelephoneClient(input.telephone);
  if (!telephone) {
    throw new ClientError("TELEPHONE_INVALIDE", "numéro de téléphone invalide");
  }
  // Pré-contrôle : une seconde inscription avec le même numéro est refusée
  // avec un motif lisible (S1-01). La comparaison porte sur la forme
  // canonique — deux écritures du même numéro sont le même compte.
  // La course résiduelle bute sur l'unicité MySQL et est reconvertie ci-dessous.
  const telephonesPris = await db
    .select({ id: comptesClients.id })
    .from(comptesClients)
    .where(eq(comptesClients.telephone, telephone))
    .limit(1);
  if (telephonesPris.length > 0) {
    throw new ClientError(
      "TELEPHONE_DEJA_UTILISE",
      "un compte existe déjà avec ce numéro",
    );
  }
  const id = input.id ?? randomUUID();
  try {
    return await db.transaction(async (tx) => {
      const utilisateur = await inscrireUtilisateur(
        emailNormalise,
        input.password,
        nom,
        tx,
      );
      await tx.insert(comptesClients).values({
        id,
        betterAuthUserId: utilisateur.id,
        email: emailNormalise,
        telephone,
        etat: "EN_ATTENTE_VALIDATION",
      });
      const trace = await enregistrerEvenement(
        {
          acteurId: id,
          roleAuMoment: "CLIENT",
          typeAction: "client.inscrire",
          entite: "compte_client",
          entiteId: id,
          apres: {
            email: emailNormalise,
            telephone,
            etat: "EN_ATTENTE_VALIDATION",
          },
        },
        tx,
      );
      if (!trace.ok) {
        throw new ClientError("JOURNAL_INDISPONIBLE", "journal indisponible");
      }
      return { id, betterAuthUserId: utilisateur.id };
    });
  } catch (erreur) {
    if (erreur instanceof ClientError) throw erreur;
    if (erreur instanceof StaffError && erreur.code === "EMAIL_DEJA_UTILISE") {
      throw new ClientError("EMAIL_DEJA_UTILISE", "email déjà utilisé");
    }
    // Course : deux inscriptions concurrentes — la seconde bute sur
    // l'unicité MySQL (ER_DUP_ENTRY, enveloppée par Drizzle). Le nom de la
    // clé dit quel champ.
    if (estDoublonMysql(erreur)) {
      if (estDoublonTelephone(erreur)) {
        throw new ClientError(
          "TELEPHONE_DEJA_UTILISE",
          "un compte existe déjà avec ce numéro",
        );
      }
      throw new ClientError("EMAIL_DEJA_UTILISE", "email déjà utilisé");
    }
    throw erreur;
  }
}

/** État du compte client pour la résolution de session (profil-session). */
export async function lireEtatCompteClient(
  betterAuthUserId: string,
): Promise<string | null> {
  const lignes = await db
    .select({ etat: comptesClients.etat })
    .from(comptesClients)
    .where(eq(comptesClients.betterAuthUserId, betterAuthUserId))
    .limit(1);
  return lignes[0]?.etat ?? null;
}
