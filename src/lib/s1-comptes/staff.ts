import { randomBytes, randomUUID } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db/client";
import { account, session as sessionAuth, user } from "@/lib/db/schema/auth-schema";
import {
  comptesStaff,
  DUREE_PREMIER_ACCES_MS,
  invitationsAgents,
  normaliserDureeInvitationJours,
  normaliserEmailStaff,
  peutCreerAdminPrincipal,
  peutInviterAdminPrincipal,
  peutInviterAgent,
  peutModifierAdmin,
  premiersAccesAdmin,
  reglages,
  roleCibleInvitationValide,
  telephoneStaffValide,
  verdictRevocationLien,
} from "@/lib/db/schema/s1-comptes";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";

// Couche applicative staff minimal (S1) : bootstrap technique, création du
// principal, invitation / acceptation agent. Tout le métier non couvert
// (validation client, 2FA obligatoire au login, audit S2) arrive aux tickets suivants.

export type ErreurStaff =
  | "NON_AUTORISE"
  | "EMAIL_DEJA_UTILISE"
  | "INVITATION_INTROUVABLE"
  | "INVITATION_EXPIREE"
  | "INVITATION_DEJA_CONSOMMEE"
  | "INVITATION_REVOQUEE"
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
  // Création directe user + compte credential, SANS ouvrir de session et
  // sans passer par le endpoint public /sign-up/email (rate-limité à
  // 3/min, cookies de session, auto-sign-in qui écraserait la session de
  // l'admin créateur). Le hash reprend le primitif better-auth, même
  // format qu'à l'inscription — la connexion email + mot de passe
  // fonctionne à l'identique. Compte credential : providerId
  // "credential", accountId = id stable de l'utilisateur.
  const emailNormalise = email.trim().toLowerCase();
  const existants = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, emailNormalise))
    .limit(1);
  if (existants.length > 0) {
    throw new StaffError("EMAIL_DEJA_UTILISE", "email déjà utilisé");
  }
  const hash = await hashPassword(password);
  const utilisateurId = randomUUID();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(user).values({
        id: utilisateurId,
        name,
        email: emailNormalise,
        emailVerified: false,
      });
      await tx.insert(account).values({
        id: randomUUID(),
        accountId: utilisateurId,
        providerId: "credential",
        userId: utilisateurId,
        password: hash,
      });
    });
  } catch (erreur) {
    // Course : deux créations concurrentes du même email — la seconde
    // bute sur l'unicité MySQL (ER_DUP_ENTRY).
    if (estDoublonEmail(erreur)) {
      throw new StaffError("EMAIL_DEJA_UTILISE", "email déjà utilisé");
    }
    throw erreur;
  }
  return { id: utilisateurId, email: emailNormalise };
}

function estDoublonEmail(erreur: unknown): boolean {
  const code = (erreur as { code?: unknown })?.code;
  if (code === "ER_DUP_ENTRY") return true;
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  return message.includes("Duplicate entry");
}

async function nbComptesStaff(): Promise<number> {
  const rows = await db.select({ n: count() }).from(comptesStaff);
  return rows[0]?.n ?? 0;
}

/**
 * Tue toutes les sessions better-auth d'un utilisateur (suspension :
 * effet immédiat sur tous les appareils — la porte de connexion refuse
 * ensuite toute reconnexion tant que le compte n'est pas VALIDE).
 */
export async function tuerSessionsStaff(
  betterAuthUserId: string,
): Promise<void> {
  await db
    .delete(sessionAuth)
    .where(eq(sessionAuth.userId, betterAuthUserId));
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

/**
 * Création directe d'un agent de service par l'administrateur principal
 * (comptoir : l'agent est présent, fiche remplie ensemble, mot de passe
 * initial transmis une seule fois). Même autorisation que l'invitation
 * (peutInviterAgent : seul un ADMIN_PRINCIPAL VALIDE). Zéro permission par
 * défaut (S2) : le compte s'authentifie mais ne peut rien faire tant que le
 * distributeur n'accorde rien. Création journalisée (S2 issue 01).
 */
export async function creerAgent(
  createurId: string,
  input: { email: string; password: string; name: string; telephone?: string },
) {
  const createurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, createurId));
  const createur = createurs[0];
  if (!createur || !peutInviterAgent(createur.role, createur.etat)) {
    throw new StaffError("NON_AUTORISE", "seul un ADMIN_PRINCIPAL valide crée un agent");
  }
  const telephone = (input.telephone ?? "").trim();
  if (!telephoneStaffValide(telephone)) {
    throw new StaffError("TELEPHONE_INVALIDE", "numéro de téléphone invalide");
  }
  if (input.password.length < 8) {
    throw new StaffError("MOT_DE_PASSE_INVALIDE", "mot de passe trop court");
  }
  const emailNormalise = input.email.trim().toLowerCase();
  const nouvelUtilisateur = await inscrireUtilisateur(
    emailNormalise,
    input.password,
    input.name,
  );
  const id = randomUUID();
  await db.insert(comptesStaff).values({
    id,
    betterAuthUserId: nouvelUtilisateur.id,
    email: emailNormalise,
    telephone: telephone === "" ? null : telephone,
    role: "AGENT",
    etat: "VALIDE",
    creePar: createurId,
  });
  await enregistrerEvenement({
    acteurId: createurId,
    roleAuMoment: createur.role,
    typeAction: "agent.creer",
    entite: "compte_staff",
    entiteId: id,
    apres: { email: emailNormalise, role: "AGENT" },
  });
  return { id, betterAuthUserId: nouvelUtilisateur.id };
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
 * Révoque un lien d'invitation encore en attente : le lien devient
 * définitivement inutilisable (présenté deux fois = refusé, comme un lien
 * consommé). L'autorisation suit le rôle cible — AGENT : seul un
 * ADMIN_PRINCIPAL VALIDE (peutInviterAgent) ; ADMIN_PRINCIPAL : même règle
 * que la création (peutInviterAdminPrincipal). Idempotente : révoquer deux
 * fois = même état, pas d'erreur, pas de seconde écriture au journal.
 * Définitive, comme toute révocation du projet : rouvrir la voie passe par
 * un nouveau lien. Journalisée (S2, invariant 8).
 */
export async function revoquerInvitation(
  revoqueurId: string,
  invitationId: string,
) {
  const invitations = await db
    .select()
    .from(invitationsAgents)
    .where(eq(invitationsAgents.id, invitationId));
  const invitation = invitations[0];
  if (!invitation) {
    throw new StaffError("INVITATION_INTROUVABLE", "lien inconnu");
  }
  const revoqueurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, revoqueurId));
  const revoqueur = revoqueurs[0];
  const autorise =
    invitation.roleCible === "AGENT"
      ? revoqueur && peutInviterAgent(revoqueur.role, revoqueur.etat)
      : revoqueur &&
        peutInviterAdminPrincipal(revoqueur.role, revoqueur.etat);
  if (!autorise) {
    throw new StaffError("NON_AUTORISE", "révoqueur non autorisé");
  }
  switch (verdictRevocationLien(invitation)) {
    case "DEJA_REVOQUE":
      return { id: invitation.id, dejaRevoque: true as const };
    case "DEJA_CONSOMME":
      throw new StaffError("INVITATION_DEJA_CONSOMMEE", "lien déjà utilisé");
    case "EXPIRE":
      throw new StaffError("INVITATION_EXPIREE", "lien expiré");
    case "A_REVOQUER":
      break;
  }
  const revoqueLe = new Date();
  await db
    .update(invitationsAgents)
    .set({ revoqueLe })
    .where(eq(invitationsAgents.id, invitation.id));
  await enregistrerEvenement({
    acteurId: revoqueurId,
    roleAuMoment: revoqueur.role,
    typeAction: "invitation.revoquer",
    entite: "invitation_agent",
    entiteId: invitation.id,
    avant: { expireLe: invitation.expireLe },
    apres: { revoqueLe },
  });
  return { id: invitation.id };
}

/**
 * Révoque un lien de premier accès (voie `fiche`) encore en attente : le
 * lien devient définitivement inutilisable pour choisir le mot de passe.
 * Même autorisation que la création et l'invitation d'un administrateur
 * principal (peutInviterAdminPrincipal : administrateur technique ou
 * principal VALIDE). Idempotente comme la révocation d'un lien : révoquer
 * deux fois = même état, pas d'erreur. Journalisée (S2, invariant 8).
 */
export async function revoquerPremierAccesAdmin(
  revoqueurId: string,
  accesId: string,
) {
  const lignes = await db
    .select()
    .from(premiersAccesAdmin)
    .where(eq(premiersAccesAdmin.id, accesId));
  const acces = lignes[0];
  if (!acces) {
    throw new StaffError("INVITATION_INTROUVABLE", "lien inconnu");
  }
  const revoqueurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, revoqueurId));
  const revoqueur = revoqueurs[0];
  if (
    !revoqueur ||
    !peutInviterAdminPrincipal(revoqueur.role, revoqueur.etat)
  ) {
    throw new StaffError("NON_AUTORISE", "révoqueur non autorisé");
  }
  switch (verdictRevocationLien(acces)) {
    case "DEJA_REVOQUE":
      return { id: acces.id, dejaRevoque: true as const };
    case "DEJA_CONSOMME":
      throw new StaffError("INVITATION_DEJA_CONSOMMEE", "lien déjà utilisé");
    case "EXPIRE":
      throw new StaffError("INVITATION_EXPIREE", "lien expiré");
    case "A_REVOQUER":
      break;
  }
  const revoqueLe = new Date();
  await db
    .update(premiersAccesAdmin)
    .set({ revoqueLe })
    .where(eq(premiersAccesAdmin.id, acces.id));
  await enregistrerEvenement({
    acteurId: revoqueurId,
    roleAuMoment: revoqueur.role,
    typeAction: "invitation.revoquer",
    entite: "premier_acces_admin",
    entiteId: acces.id,
    avant: { expireLe: acces.expireLe },
    apres: { revoqueLe },
  });
  return { id: acces.id };
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
  if (invitation.revoqueLe !== null) {
    throw new StaffError("INVITATION_REVOQUEE", "lien révoqué");
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
  if (invitation.revoqueLe !== null) {
    throw new StaffError("INVITATION_REVOQUEE", "lien révoqué");
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
  await enregistrerEvenement({
    acteurId: id,
    roleAuMoment: "AGENT",
    typeAction: "agent.inscrire",
    entite: "compte_staff",
    entiteId: id,
    apres: { email: input.email, invitation: invitation.id },
  });
  return { id, betterAuthUserId: user.id };
}

/**
 * Correction support d'un compte d'administration (le « côté sombre »
 * livraison : coquille sur le nom, téléphone de contact oublié).
 * Périmètre : nom + téléphone uniquement, sur un compte ADMIN_* VALIDE.
 * Rôle, email, état et secrets ne passent jamais par ici (voir
 * peutModifierAdmin) : une erreur de rôle ou d'email se corrige par
 * révocation + recréation tracées. L'auto-correction de son propre
 * nom / téléphone est autorisée. Chaque correction est journalisée
 * (S2, invariant 8 : avant/après, acteur, rôle au moment).
 */
export async function modifierAdminSupport(
  modificateurId: string,
  cibleId: string,
  input: { nom: string; telephone?: string },
) {
  const modificateurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, modificateurId));
  const modificateur = modificateurs[0];
  if (
    !modificateur ||
    !peutModifierAdmin(modificateur.role, modificateur.etat)
  ) {
    throw new StaffError("NON_AUTORISE", "modificateur non autorisé");
  }
  const cibles = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, cibleId));
  const cible = cibles[0];
  if (
    !cible ||
    (cible.role !== "ADMIN_PRINCIPAL" &&
      cible.role !== "ADMIN_TECHNIQUE") ||
    cible.etat !== "VALIDE"
  ) {
    throw new StaffError("NON_AUTORISE", "cible non modifiable");
  }
  const nom = input.nom.trim();
  const telephone = (input.telephone ?? "").trim();
  if (!nom || nom.length > 255) {
    throw new StaffError("NON_AUTORISE", "nom invalide");
  }
  if (!telephoneStaffValide(telephone)) {
    throw new StaffError("TELEPHONE_INVALIDE", "numéro de téléphone invalide");
  }
  const utilisateurs = await db
    .select()
    .from(user)
    .where(eq(user.id, cible.betterAuthUserId));
  const utilisateur = utilisateurs[0];
  if (!utilisateur) {
    throw new StaffError("NON_AUTORISE", "compte auth introuvable");
  }
  const avant = { nom: utilisateur.name, telephone: cible.telephone };
  const telephoneValeur = telephone === "" ? null : telephone;
  if (avant.nom === nom && (avant.telephone ?? null) === telephoneValeur) {
    return { id: cible.id, inchange: true as const };
  }
  await db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({ name: nom })
      .where(eq(user.id, cible.betterAuthUserId));
    await tx
      .update(comptesStaff)
      .set({ telephone: telephoneValeur })
      .where(eq(comptesStaff.id, cible.id));
  });
  await enregistrerEvenement({
    acteurId: modificateurId,
    roleAuMoment: modificateur.role,
    typeAction: "admin.modifier",
    entite: "compte_staff",
    entiteId: cible.id,
    avant,
    apres: { nom, telephone: telephoneValeur },
  });
  return { id: cible.id, inchange: false as const };
}

/**
 * Correction support d'un agent de service (coquille sur le nom,
 * téléphone de contact oublié). Périmètre : nom + téléphone uniquement,
 * sur un compte AGENT VALIDE. Rôle, email, état et secrets ne passent
 * jamais par ici : une erreur de rôle se corrige par révocation +
 * recréation, l'email par la zone « Identifiant de connexion »
 * (modifierEmailAgentSupport, confirmé deux fois). Seul un
 * administrateur principal VALIDE corrige
 * (même autorisation que créer / révoquer un agent). Chaque correction
 * est journalisée (S2, invariant 8 : avant/après, acteur, rôle au moment).
 */
export async function modifierAgentSupport(
  modificateurId: string,
  cibleId: string,
  input: { nom: string; telephone?: string },
) {
  const modificateurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, modificateurId));
  const modificateur = modificateurs[0];
  if (
    !modificateur ||
    !peutInviterAgent(modificateur.role, modificateur.etat)
  ) {
    throw new StaffError("NON_AUTORISE", "modificateur non autorisé");
  }
  const cibles = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, cibleId));
  const cible = cibles[0];
  if (!cible || cible.role !== "AGENT" || cible.etat !== "VALIDE") {
    throw new StaffError("NON_AUTORISE", "cible non modifiable");
  }
  const nom = input.nom.trim();
  const telephone = (input.telephone ?? "").trim();
  if (!nom || nom.length > 255) {
    throw new StaffError("NON_AUTORISE", "nom invalide");
  }
  if (!telephoneStaffValide(telephone)) {
    throw new StaffError("TELEPHONE_INVALIDE", "numéro de téléphone invalide");
  }
  const utilisateurs = await db
    .select()
    .from(user)
    .where(eq(user.id, cible.betterAuthUserId));
  const utilisateur = utilisateurs[0];
  if (!utilisateur) {
    throw new StaffError("NON_AUTORISE", "compte auth introuvable");
  }
  const avant = { nom: utilisateur.name, telephone: cible.telephone };
  const telephoneValeur = telephone === "" ? null : telephone;
  if (avant.nom === nom && (avant.telephone ?? null) === telephoneValeur) {
    return { id: cible.id, inchange: true as const };
  }
  await db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({ name: nom })
      .where(eq(user.id, cible.betterAuthUserId));
    await tx
      .update(comptesStaff)
      .set({ telephone: telephoneValeur })
      .where(eq(comptesStaff.id, cible.id));
  });
  await enregistrerEvenement({
    acteurId: modificateurId,
    roleAuMoment: modificateur.role,
    typeAction: "agent.modifier",
    entite: "compte_staff",
    entiteId: cible.id,
    avant,
    apres: { nom, telephone: telephoneValeur },
  });
  return { id: cible.id, inchange: false as const };
}

/**
 * Change l'email (identifiant de connexion) d'un agent de service.
 * Opération sensible : l'email est la clé du compte et le canal de
 * confiance — d'où confirmation explicite côté UI ET normalisation
 * stricte ici. Périmètre : compte AGENT VALIDE uniquement, jamais
 * REVOQUE (recréation) ni SUSPENDU (lever d'abord). Seul un
 * administrateur principal VALIDE agit. Unicité garantie par
 * pré-contrôle + contrainte UNIQUE (course → EMAIL_DEJA_UTILISE).
 * Les sessions survivent (clé = userId, pas l'email) ; en cas de doute
 * sur qui détient l'ancien accès, suspendre d'abord. Journalisée
 * (S2, invariant 8 : avant/après).
 */
export async function modifierEmailAgentSupport(
  modificateurId: string,
  cibleId: string,
  input: { email: string },
) {
  const modificateurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, modificateurId));
  const modificateur = modificateurs[0];
  if (
    !modificateur ||
    !peutInviterAgent(modificateur.role, modificateur.etat)
  ) {
    throw new StaffError("NON_AUTORISE", "modificateur non autorisé");
  }
  const cibles = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, cibleId));
  const cible = cibles[0];
  if (!cible || cible.role !== "AGENT" || cible.etat !== "VALIDE") {
    throw new StaffError("NON_AUTORISE", "cible non modifiable");
  }
  const email = normaliserEmailStaff(input.email);
  if (!email) {
    throw new StaffError("NON_AUTORISE", "email invalide");
  }
  if (email === cible.email) {
    return { id: cible.id, inchange: true as const };
  }
  const occupes = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (occupes.length > 0) {
    throw new StaffError("EMAIL_DEJA_UTILISE", "email déjà utilisé");
  }
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({ email })
        .where(eq(user.id, cible.betterAuthUserId));
      await tx
        .update(comptesStaff)
        .set({ email })
        .where(eq(comptesStaff.id, cible.id));
    });
  } catch (erreur) {
    if (estDoublonEmail(erreur)) {
      throw new StaffError("EMAIL_DEJA_UTILISE", "email déjà utilisé");
    }
    throw erreur;
  }
  await enregistrerEvenement({
    acteurId: modificateurId,
    roleAuMoment: modificateur.role,
    typeAction: "agent.modifier",
    entite: "compte_staff",
    entiteId: cible.id,
    avant: { email: cible.email },
    apres: { email },
  });
  return { id: cible.id, inchange: false as const };
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
 * Ouvre un lien de réinitialisation de mot de passe pour un agent de
 * service (mot de passe oublié) : même mécanique que le premier accès
 * (jeton unique, 24 h, choix du mot de passe uniquement, aucune session).
 * Seul un administrateur principal VALIDE génère (peutInviterAgent :
 * celui qui gère les agents), cible AGENT VALIDE uniquement — jamais
 * REVOQUE (recréation), jamais SUSPENDU (lever d'abord). Journalisé
 * (agent.lien_mdp, S2) : un lien de mot de passe se trace.
 */
export async function ouvrirLienMotDePasseAgent(
  createurId: string,
  agentId: string,
) {
  const createurs = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, createurId));
  const createur = createurs[0];
  if (!createur || !peutInviterAgent(createur.role, createur.etat)) {
    throw new StaffError("NON_AUTORISE", "créateur non autorisé");
  }
  const cibles = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, agentId));
  const cible = cibles[0];
  if (!cible || cible.role !== "AGENT" || cible.etat !== "VALIDE") {
    throw new StaffError("NON_AUTORISE", "cible non éligible");
  }
  const acces = {
    id: randomUUID(),
    compteStaffCible: agentId,
    jeton: randomBytes(32).toString("base64url"),
    expireLe: new Date(Date.now() + DUREE_PREMIER_ACCES_MS),
    creePar: createurId,
  };
  await db.insert(premiersAccesAdmin).values(acces);
  await enregistrerEvenement({
    acteurId: createurId,
    roleAuMoment: createur.role,
    typeAction: "agent.lien_mdp",
    entite: "compte_staff",
    entiteId: agentId,
    apres: { lien: acces.id, expireLe: acces.expireLe },
  });
  return acces;
}

/**
 * Lecture d'un lien de premier accès pour l'écran public : ne révèle que le
 * statut (inconnu / déjà utilisé / expiré / révoqué / valide). L'email du
 * compte n'est montré que si le lien est encore valide — jamais sur un lien
 * consommé, expiré ou révoqué (un identifiant de connexion ne se divulgue
 * pas). Le rôle suit pour adapter le texte (un agent n'a pas de 2FA).
 * Toute l'horloge vit ici, pas dans le rendu.
 */
export async function lirePremierAcces(jeton: string): Promise<
  | { statut: "VALIDE"; email: string; role: string }
  | { statut: "INCONNU" | "CONSOMME" | "EXPIRE" | "REVOQUE"; email: null }
> {
  const lignes = await db
    .select({
      email: comptesStaff.email,
      role: comptesStaff.role,
      expireLe: premiersAccesAdmin.expireLe,
      consommeLe: premiersAccesAdmin.consommeLe,
      revoqueLe: premiersAccesAdmin.revoqueLe,
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
  if (acces.revoqueLe !== null) return { statut: "REVOQUE", email: null };
  if (acces.expireLe.getTime() < Date.now())
    return { statut: "EXPIRE", email: null };
  return { statut: "VALIDE", email: acces.email, role: acces.role };
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
  if (acces.revoqueLe !== null) {
    throw new StaffError("INVITATION_REVOQUEE", "lien révoqué");
  }
  if (acces.expireLe.getTime() < Date.now()) {
    throw new StaffError("INVITATION_EXPIREE", "lien expiré");
  }
  const cibles = await db
    .select()
    .from(comptesStaff)
    .where(eq(comptesStaff.id, acces.compteStaffCible));
  const cible = cibles[0];
  if (
    !cible ||
    (cible.role !== "ADMIN_PRINCIPAL" && cible.role !== "AGENT") ||
    cible.etat !== "VALIDE"
  ) {
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
