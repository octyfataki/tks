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

function estDoublonTelephone(erreur: unknown): boolean {
  return messagesErreurMysql(erreur).some((texte) =>
    texte.toLowerCase().includes("telephone"),
  );
}

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
