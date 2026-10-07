import { randomBytes, randomUUID } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { account } from "@/lib/db/schema/auth-schema";
import {
  comptesStaff,
  DUREE_PREMIER_ACCES_MS,
  invitationsAgents,
  normaliserDureeInvitationJours,
  peutCreerAdminPrincipal,
  peutInviterAdminPrincipal,
  peutInviterAgent,
  premiersAccesAdmin,
  reglages,
  roleCibleInvitationValide,
  telephoneStaffValide,
} from "@/lib/db/schema/s1-comptes";

// Couche applicative staff minimal (S1) : bootstrap technique, création du
// principal, invitation / acceptation agent. Tout le métier non couvert
// (validation client, 2FA obligatoire au login, audit S2) arrive aux tickets suivants.

export type ErreurStaff =
  | "NON_AUTORISE"
  | "INVITATION_INTROUVABLE"
  | "INVITATION_EXPIREE"
  | "INVITATION_DEJA_CONSOMMEE"
  | "TELEPHONE_INVALIDE"
  | "MOT_DE_PASSE_INVALIDE"
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
 * Durée par défaut d'un lien d'invitation (jours) : le réglage
 * `duree_invitation_jours` modifiable dans /admin/parametres, sinon 7.
 * Toujours normalisée [1, 30] — un réglage illisible ne casse jamais un lien.
 */
async function dureeInvitationDefaut(): Promise<number> {
  const lignes = await db
    .select({ valeur: reglages.valeur })
    .from(reglages)
    .where(eq(reglages.cle, "duree_invitation_jours"));
  return normaliserDureeInvitationJours(lignes[0]?.valeur);
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
  input: { email: string; password: string; name: string; telephone?: string },
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
  const telephone = (input.telephone ?? "").trim();
  if (!telephoneStaffValide(telephone)) {
    throw new StaffError("TELEPHONE_INVALIDE", "numéro de téléphone invalide");
  }
  const user = await inscrireUtilisateur(input.email, input.password, input.name);
  const id = randomUUID();
  await db.insert(comptesStaff).values({
    id,
    betterAuthUserId: user.id,
    email: input.email,
    telephone: telephone === "" ? null : telephone,
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
  const dureeJours = options?.dureeJours ?? (await dureeInvitationDefaut());
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
 * ÉCART ASSUMÉ à S1-spec (voir peutInviterAdminPrincipal) : un administrateur
 * technique ou principal VALIDE crée un lien d'invitation qui ne peut créer
 * qu'un compte ADMIN_PRINCIPAL. La personne choisit elle-même email + mot de
 * passe — le rôle reste fixé par le lien, jamais choisi à l'inscription.
 * Même table que les agents (colonne role_cible discriminante), usage unique,
 * durée limitée, échec journalisé (S2).
 */
export async function creerInvitationAdminPrincipal(
  createurId: string,
  options?: { dureeJours?: number },
) {
  const createurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, createurId));
  const createur = createurs[0];
  if (!createur || !peutInviterAdminPrincipal(createur.role, createur.etat)) {
    throw new StaffError("NON_AUTORISE", "créateur non autorisé");
  }
  const dureeJours = options?.dureeJours ?? (await dureeInvitationDefaut());
  const invitation = {
    id: randomUUID(),
    jeton: randomBytes(32).toString("base64url"),
    roleCible: "ADMIN_PRINCIPAL",
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
 * La personne invitée crée elle-même son compte administrateur principal par
 * le lien : choisit email + mot de passe, le rôle ADMIN_PRINCIPAL vient du
 * lien. Usage unique, expiré ou consommé = refus. Un lien AGENT est refusé
 * ici (anti-escalade).
 */
export async function accepterInvitationAdminPrincipal(input: {
  jeton: string;
  email: string;
  password: string;
  name: string;
  telephone?: string;
}) {
  const rows = await db
    .select()
    .from(invitationsAgents)
    .where(eq(invitationsAgents.jeton, input.jeton));
  const invitation = rows[0];
  if (!invitation) {
    throw new StaffError("INVITATION_INTROUVABLE", "lien inconnu");
  }
  if (invitation.roleCible !== "ADMIN_PRINCIPAL") {
    throw new StaffError(
      "NON_AUTORISE",
      "ce lien ne crée pas un administrateur principal",
    );
  }
  if (invitation.consommeLe !== null) {
    throw new StaffError("INVITATION_DEJA_CONSOMMEE", "lien déjà utilisé");
  }
  if (invitation.expireLe.getTime() < Date.now()) {
    throw new StaffError("INVITATION_EXPIREE", "lien expiré");
  }
  const telephoneAdmin = (input.telephone ?? "").trim();
  if (!telephoneStaffValide(telephoneAdmin)) {
    throw new StaffError("TELEPHONE_INVALIDE", "numéro de téléphone invalide");
  }
  const user = await inscrireUtilisateur(input.email, input.password, input.name);
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(comptesStaff).values({
      id,
      betterAuthUserId: user.id,
      email: input.email,
      telephone: telephoneAdmin === "" ? null : telephoneAdmin,
      role: "ADMIN_PRINCIPAL",
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

/**
 * L'agent s'inscrit par le lien : choisit email + mot de passe, le rôle AGENT
 * vient du lien. Usage unique — même jeton deux fois = un seul compte.
 * Le lien doit cibler AGENT : un lien ADMIN_PRINCIPAL est refusé ici
 * (anti-escalade : chaque rôle a son chemin d'acceptation).
 */
export async function accepterInvitationAgent(input: {
  jeton: string;
  email: string;
  password: string;
  name: string;
  telephone?: string;
}) {
  const rows = await db
    .select()
    .from(invitationsAgents)
    .where(eq(invitationsAgents.jeton, input.jeton));
  const invitation = rows[0];
  if (!invitation) {
    throw new StaffError("INVITATION_INTROUVABLE", "lien inconnu");
  }
  if (invitation.roleCible !== "AGENT") {
    throw new StaffError("NON_AUTORISE", "ce lien ne crée pas un agent");
  }
  if (invitation.consommeLe !== null) {
    throw new StaffError("INVITATION_DEJA_CONSOMMEE", "lien déjà utilisé");
  }
  if (invitation.expireLe.getTime() < Date.now()) {
    throw new StaffError("INVITATION_EXPIREE", "lien expiré");
  }
  const telephoneAgent = (input.telephone ?? "").trim();
  if (!telephoneStaffValide(telephoneAgent)) {
    throw new StaffError("TELEPHONE_INVALIDE", "numéro de téléphone invalide");
  }
  const user = await inscrireUtilisateur(input.email, input.password, input.name);
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(comptesStaff).values({
      id,
      betterAuthUserId: user.id,
      email: input.email,
      telephone: telephoneAgent === "" ? null : telephoneAgent,
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

/**
 * Lien de premier accès : après une création directe, la personne choisit
 * elle-même son mot de passe via un lien à usage unique (24 h). Le créateur
 * doit pouvoir créer un principal ; la cible doit être un ADMIN_PRINCIPAL
 * VALIDE. Le lien n'ouvre AUCUNE session et ne contourne pas la 2FA : il
 * autorise le seul choix du mot de passe, la connexion suivante exige
 * email + mot de passe + TOTP.
 */
export async function ouvrirPremierAccesAdmin(
  createurId: string,
  compteStaffCibleId: string,
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
  const cibles = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, compteStaffCibleId));
  const cible = cibles[0];
  if (
    !cible ||
    cible.role !== "ADMIN_PRINCIPAL" ||
    cible.etat !== "VALIDE"
  ) {
    throw new StaffError("NON_AUTORISE", "cible non éligible");
  }
  const acces = {
    id: randomUUID(),
    compteStaffCible: compteStaffCibleId,
    jeton: randomBytes(32).toString("base64url"),
    expireLe: new Date(Date.now() + DUREE_PREMIER_ACCES_MS),
    creePar: createurId,
  };
  await db.insert(premiersAccesAdmin).values(acces);
  return acces;
}

/**
 * Lecture d'un lien de premier accès pour l'écran public : ne révèle que le
 * statut (inconnu / déjà utilisé / expiré / valide). L'email du compte n'est
 * montré que si le lien est encore valide — jamais sur un lien consommé ou
 * expiré (un identifiant de connexion ne se divulgue pas).
 * Toute l'horloge vit ici, pas dans le rendu.
 */
export async function lirePremierAcces(jeton: string): Promise<
  | { statut: "VALIDE"; email: string }
  | { statut: "INCONNU" | "CONSOMME" | "EXPIRE"; email: null }
> {
  const lignes = await db
    .select({
      email: comptesStaff.email,
      expireLe: premiersAccesAdmin.expireLe,
      consommeLe: premiersAccesAdmin.consommeLe,
    })
    .from(premiersAccesAdmin)
    .innerJoin(
      comptesStaff,
      eq(comptesStaff.id, premiersAccesAdmin.compteStaffCible),
    )
    .where(eq(premiersAccesAdmin.jeton, jeton));
  const acces = lignes[0];
  if (!acces) return { statut: "INCONNU", email: null };
  if (acces.consommeLe !== null)
    return { statut: "CONSOMME", email: null };
  if (acces.expireLe.getTime() < Date.now())
    return { statut: "EXPIRE", email: null };
  return { statut: "VALIDE", email: acces.email };
}

/**
 * Consomme un lien de premier accès : définit le mot de passe du compte
 * (hashé avec le primitive better-auth, même format qu'à l'inscription) et
 * marque le lien consommé, en une seule transaction. Jeton inconnu, expiré
 * ou déjà utilisé = refus. Mot de passe < 8 caractères = refus.
 */
export async function definirMotDePassePremierAcces(input: {
  jeton: string;
  password: string;
}) {
  if (input.password.length < 8) {
    throw new StaffError("MOT_DE_PASSE_INVALIDE", "mot de passe trop court");
  }
  const rows = await db
    .select()
    .from(premiersAccesAdmin)
    .where(eq(premiersAccesAdmin.jeton, input.jeton));
  const acces = rows[0];
  if (!acces) {
    throw new StaffError("INVITATION_INTROUVABLE", "lien inconnu");
  }
  if (acces.consommeLe !== null) {
    throw new StaffError("INVITATION_DEJA_CONSOMMEE", "lien déjà utilisé");
  }
  if (acces.expireLe.getTime() < Date.now()) {
    throw new StaffError("INVITATION_EXPIREE", "lien expiré");
  }
  const cibles = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, acces.compteStaffCible));
  const cible = cibles[0];
  if (!cible || cible.role !== "ADMIN_PRINCIPAL" || cible.etat !== "VALIDE") {
    throw new StaffError("NON_AUTORISE", "compte non éligible");
  }
  const hash = await hashPassword(input.password);
  await db.transaction(async (tx) => {
    const resultat = await tx
      .update(account)
      .set({ password: hash })
      .where(
        and(
          eq(account.userId, cible.betterAuthUserId),
          eq(account.providerId, "credential"),
        ),
      );
    // mysql2 renvoie [ResultSetHeader, ...] : affectedRows vit en [0].
    const entete = (Array.isArray(resultat) ? resultat[0] : resultat) as unknown as {
      affectedRows?: number;
    };
    if (entete?.affectedRows !== 1) {
      throw new StaffError("NON_AUTORISE", "compte introuvable côté auth");
    }
    await tx
      .update(premiersAccesAdmin)
      .set({ consommeLe: new Date() })
      .where(eq(premiersAccesAdmin.id, acces.id));
  });
  return { id: acces.id };
}
