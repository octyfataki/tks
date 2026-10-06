import { randomBytes, randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  comptesStaff,
  invitationsAgents,
  peutCreerAdminPrincipal,
  peutInviterAgent,
  roleCibleInvitationValide,
} from "@/lib/db/schema/s1-comptes";

// Couche applicative staff minimal (S1) : bootstrap technique, création du
// principal, invitation / acceptation agent. Tout le métier non couvert
// (validation client, 2FA obligatoire au login, audit S2) arrive aux tickets suivants.

export type ErreurStaff =
  | "NON_AUTORISE"
  | "INVITATION_INTROUVABLE"
  | "INVITATION_EXPIREE"
  | "INVITATION_DEJA_CONSOMMEE"
  | "SECOND_FACTEUR_NON_REQUIS"
  | "FACTEUR_DEJA_EXISTANT"
  | "FACTEUR_INTROUVABLE"
  | "PIECE_REQUISE"
  | "ACCES_EXPIRE"
  | "ACCES_CONSOMME";

export class StaffError extends Error {
  code: ErreurStaff;
  constructor(code: ErreurStaff, message: string) {
    super(message);
    this.code = code;
  }
}

async function inscrireUtilisateur(email: string, password: string, name: string) {
  const res = (await auth.api.signUpEmail({
    body: { email, password, name },
    headers: new Headers(),
  })) as unknown as { user: { id: string; email: string } };
  if (!res?.user?.id) throw new StaffError("NON_AUTORISE", "inscription impossible");
  return res.user;
}

async function nbComptesStaff(): Promise<number> {
  const rows = await db.select({ n: count() }).from(comptesStaff);
  return rows[0]?.n ?? 0;
}

/**
 * Bootstrap : crée le TOUT PREMIER compte — l'ADMIN_TECHNIQUE du développeur,
 * sans créateur. Refusé dès qu'un compte staff existe.
 */
export async function bootstrapAdminTechnique(input: {
  email: string;
  password: string;
  name: string;
}) {
  if ((await nbComptesStaff()) > 0) {
    throw new StaffError("NON_AUTORISE", "bootstrap déjà effectué");
  }
  const user = await inscrireUtilisateur(input.email, input.password, input.name);
  const id = randomUUID();
  await db.insert(comptesStaff).values({
    id,
    betterAuthUserId: user.id,
    email: input.email,
    role: "ADMIN_TECHNIQUE",
    etat: "VALIDE",
    creePar: null,
  });
  return { id, betterAuthUserId: user.id };
}

/**
 * L'ADMIN_TECHNIQUE (ou un ADMIN_PRINCIPAL) crée le compte du distributeur.
 * Le créateur doit être VALIDE.
 */
export async function creerAdminPrincipal(
  createurId: string,
  input: { email: string; password: string; name: string },
) {
  const createurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, createurId));
  const createur = createurs[0];
  if (
    !createur ||
    !peutCreerAdminPrincipal(createur.role, createur.etat)
  ) {
    throw new StaffError("NON_AUTORISE", "créateur non autorisé");
  }
  const user = await inscrireUtilisateur(input.email, input.password, input.name);
  const id = randomUUID();
  await db.insert(comptesStaff).values({
    id,
    betterAuthUserId: user.id,
    email: input.email,
    role: "ADMIN_PRINCIPAL",
    etat: "VALIDE",
    creePar: createurId,
  });
  return { id, betterAuthUserId: user.id };
}

/** Un ADMIN_PRINCIPAL VALIDE crée un lien d'invitation agent (rôle fixé : AGENT). */
export async function creerInvitationAgent(
  createurId: string,
  options?: { dureeJours?: number },
) {
  const createurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, createurId));
  const createur = createurs[0];
  if (!createur || !peutInviterAgent(createur.role, createur.etat)) {
    throw new StaffError("NON_AUTORISE", "seul un ADMIN_PRINCIPAL valide invite");
  }
  const dureeJours = options?.dureeJours ?? 7;
  const invitation = {
    id: randomUUID(),
    jeton: randomBytes(32).toString("base64url"),
    roleCible: "AGENT",
    expireLe: new Date(Date.now() + dureeJours * 24 * 60 * 60 * 1000),
    creePar: createurId,
  };
  if (!roleCibleInvitationValide(invitation.roleCible)) {
    throw new StaffError("NON_AUTORISE", "rôle cible invalide");
  }
  await db.insert(invitationsAgents).values(invitation);
  return invitation;
}

/**
 * L'agent s'inscrit par le lien : choisit email + mot de passe, le rôle AGENT
 * vient du lien. Usage unique — même jeton deux fois = un seul compte.
 */
export async function accepterInvitationAgent(input: {
  jeton: string;
  email: string;
  password: string;
  name: string;
}) {
  const rows = await db
    .select()
    .from(invitationsAgents)
    .where(eq(invitationsAgents.jeton, input.jeton));
  const invitation = rows[0];
  if (!invitation) {
    throw new StaffError("INVITATION_INTROUVABLE", "lien inconnu");
  }
  if (invitation.consommeLe !== null) {
    throw new StaffError("INVITATION_DEJA_CONSOMMEE", "lien déjà utilisé");
  }
  if (invitation.expireLe.getTime() < Date.now()) {
    throw new StaffError("INVITATION_EXPIREE", "lien expiré");
  }
  const user = await inscrireUtilisateur(input.email, input.password, input.name);
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(comptesStaff).values({
      id,
      betterAuthUserId: user.id,
      email: input.email,
      role: "AGENT",
      etat: "VALIDE",
      creePar: invitation.creePar,
    });
    await tx
      .update(invitationsAgents)
      .set({ consommeLe: new Date(), consommePar: id })
      .where(eq(invitationsAgents.id, invitation.id));
  });
  return { id, betterAuthUserId: user.id };
}
