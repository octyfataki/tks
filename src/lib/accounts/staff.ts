import { randomBytes, randomUUID } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db, type ExecuteurDb, type TransactionDb } from "@/lib/db/client";
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
} from "@/lib/db/schema/accounts";
import { enregistrerEvenement } from "@/lib/authorizations/journal";
import { lignesEcrites } from "./mysql-result";

export type ErreurStaff =
  | "NON_AUTORISE"
  | "EMAIL_DEJA_UTILISE"
  | "EMAIL_INVALIDE"
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
  | "ACCES_CONSOMME"
  | "JOURNAL_INDISPONIBLE";

export class StaffError extends Error {
  code: ErreurStaff;
  constructor(code: ErreurStaff, message: string) {
    super(message);
    this.code = code;
  }
}

type TransactionStaff = TransactionDb;

async function tracer(
  ex: ExecuteurDb,
  evenement: Parameters<typeof enregistrerEvenement>[0],
): Promise<void> {
  const trace = await enregistrerEvenement(evenement, ex);
  if (!trace.ok) {
    throw new StaffError("JOURNAL_INDISPONIBLE", "journal indisponible");
  }
}

export async function inscrireUtilisateur(
  email: string,
  password: string,
  name: string,
  ex?: TransactionStaff,
) {
  const emailNormalise = email.trim().toLowerCase();
  const cible: ExecuteurDb = ex ?? db;
  const existants = await cible
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, emailNormalise))
    .limit(1);
  if (existants.length > 0) {
    throw new StaffError("EMAIL_DEJA_UTILISE", "email déjà utilisé");
  }
  const hash = await hashPassword(password);
  const utilisateurId = randomUUID();
  const ecrire = async (w: ExecuteurDb) => {
    await w.insert(user).values({
      id: utilisateurId,
      name,
      email: emailNormalise,
      emailVerified: false,
    });
    await w.insert(account).values({
      id: randomUUID(),
      accountId: utilisateurId,
      providerId: "credential",
      userId: utilisateurId,
      password: hash,
    });
  };
  try {
    if (ex) {
      await ecrire(ex);
    } else {
      await db.transaction(ecrire);
    }
  } catch (erreur) {
    if (estDoublonEmail(erreur)) {
      throw new StaffError("EMAIL_DEJA_UTILISE", "email déjà utilisé");
    }
    throw erreur;
  }
  return { id: utilisateurId, email: emailNormalise };
}

function estDoublonEmail(erreur: unknown): boolean {
  const textes: string[] = [];
  let courante: unknown = erreur;
  for (let profondeur = 0; profondeur < 4; profondeur++) {
    if (!courante || typeof courante !== "object") break;
    const e = courante as {
      message?: unknown;
      sqlMessage?: unknown;
      code?: unknown;
      cause?: unknown;
    };
    if (typeof e.message === "string") textes.push(e.message);
    if (typeof e.sqlMessage === "string") textes.push(e.sqlMessage);
    if (typeof e.code === "string") textes.push(e.code);
    courante = e.cause;
  }
  return textes.some(
    (texte) =>
      texte.includes("ER_DUP_ENTRY") || texte.includes("Duplicate entry"),
  );
}

async function nbComptesStaff(): Promise<number> {
  const rows = await db.select({ n: count() }).from(comptesStaff);
  return rows[0]?.n ?? 0;
}

export async function tuerSessionsStaff(
  betterAuthUserId: string,
  ex: ExecuteurDb = db,
): Promise<void> {
  await ex
    .delete(sessionAuth)
    .where(eq(sessionAuth.userId, betterAuthUserId));
}

async function dureeInvitationDefaut(): Promise<number> {
  const lignes = await db
    .select({ valeur: reglages.valeur })
    .from(reglages)
    .where(eq(reglages.cle, "duree_invitation_jours"));
  return normaliserDureeInvitationJours(lignes[0]?.valeur);
}

const ID_ADMIN_TECHNIQUE_INITIAL = "00000000-0000-4000-8000-000000000000";

export async function bootstrapAdminTechnique(input: {
  email: string;
  password: string;
  name: string;
}) {
  if ((await nbComptesStaff()) > 0) {
    throw new StaffError("NON_AUTORISE", "bootstrap déjà effectué");
  }
  if (input.password.length < 8) {
    throw new StaffError("MOT_DE_PASSE_INVALIDE", "mot de passe trop court");
  }
  const emailNormalise = normaliserEmailStaff(input.email);
  if (!emailNormalise) {
    throw new StaffError("EMAIL_INVALIDE", "email invalide");
  }
  try {
    return await db.transaction(async (tx) => {
      const lignes = await tx.select({ n: count() }).from(comptesStaff);
      if ((lignes[0]?.n ?? 0) > 0) {
        throw new StaffError("NON_AUTORISE", "bootstrap déjà effectué");
      }
      const utilisateur = await inscrireUtilisateur(
        emailNormalise,
        input.password,
        input.name,
        tx,
      );
      await tx.insert(comptesStaff).values({
        id: ID_ADMIN_TECHNIQUE_INITIAL,
        betterAuthUserId: utilisateur.id,
        email: emailNormalise,
        role: "ADMIN_TECHNIQUE",
        etat: "VALIDE",
        creePar: null,
      });
      return { id: ID_ADMIN_TECHNIQUE_INITIAL, betterAuthUserId: utilisateur.id };
    });
  } catch (erreur) {
    if (estDoublonEmail(erreur)) {
      throw new StaffError("NON_AUTORISE", "bootstrap déjà effectué");
    }
    throw erreur;
  }
}

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
  if (input.password.length < 8) {
    throw new StaffError("MOT_DE_PASSE_INVALIDE", "mot de passe trop court");
  }
  const emailNormalise = normaliserEmailStaff(input.email);
  if (!emailNormalise) {
    throw new StaffError("EMAIL_INVALIDE", "email invalide");
  }
  return db.transaction(async (tx) => {
    const utilisateur = await inscrireUtilisateur(
      emailNormalise,
      input.password,
      input.name,
      tx,
    );
    const id = randomUUID();
    await tx.insert(comptesStaff).values({
      id,
      betterAuthUserId: utilisateur.id,
      email: emailNormalise,
      telephone: telephone === "" ? null : telephone,
      role: "ADMIN_PRINCIPAL",
      etat: "VALIDE",
      creePar: createurId,
    });
    return { id, betterAuthUserId: utilisateur.id };
  });
}

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
  const emailNormalise = normaliserEmailStaff(input.email);
  if (!emailNormalise) {
    throw new StaffError("EMAIL_INVALIDE", "email invalide");
  }
  const id = randomUUID();
  const nouvelUtilisateur = await db.transaction(async (tx) => {
    const utilisateur = await inscrireUtilisateur(
      emailNormalise,
      input.password,
      input.name,
      tx,
    );
    await tx.insert(comptesStaff).values({
      id,
      betterAuthUserId: utilisateur.id,
      email: emailNormalise,
      telephone: telephone === "" ? null : telephone,
      role: "AGENT",
      etat: "VALIDE",
      creePar: createurId,
    });
    await tracer(tx, {
      acteurId: createurId,
      roleAuMoment: createur.role,
      typeAction: "agent.creer",
      entite: "compte_staff",
      entiteId: id,
      apres: { email: emailNormalise, role: "AGENT" },
    });
    return utilisateur;
  });
  return { id, betterAuthUserId: nouvelUtilisateur.id };
}

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
  await db.transaction(async (tx) => {
    await tx
      .update(invitationsAgents)
      .set({ revoqueLe })
      .where(eq(invitationsAgents.id, invitation.id));
    await tracer(tx, {
      acteurId: revoqueurId,
      roleAuMoment: revoqueur.role,
      typeAction: "invitation.revoquer",
      entite: "invitation_agent",
      entiteId: invitation.id,
      avant: { expireLe: invitation.expireLe },
      apres: { revoqueLe },
    });
  });
  return { id: invitation.id };
}

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
  await db.transaction(async (tx) => {
    await tx
      .update(premiersAccesAdmin)
      .set({ revoqueLe })
      .where(eq(premiersAccesAdmin.id, acces.id));
    await tracer(tx, {
      acteurId: revoqueurId,
      roleAuMoment: revoqueur.role,
      typeAction: "invitation.revoquer",
      entite: "premier_acces_admin",
      entiteId: acces.id,
      avant: { expireLe: acces.expireLe },
      apres: { revoqueLe },
    });
  });
  return { id: acces.id };
}

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
  if (input.password.length < 8) {
    throw new StaffError("MOT_DE_PASSE_INVALIDE", "mot de passe trop court");
  }
  const emailNormalise = normaliserEmailStaff(input.email);
  if (!emailNormalise) {
    throw new StaffError("EMAIL_INVALIDE", "email invalide");
  }
  const telephoneAdmin = (input.telephone ?? "").trim();
  if (!telephoneStaffValide(telephoneAdmin)) {
    throw new StaffError("TELEPHONE_INVALIDE", "numéro de téléphone invalide");
  }
  const id = randomUUID();
  const user = await db.transaction(async (tx) => {
    const utilisateur = await inscrireUtilisateur(
      emailNormalise,
      input.password,
      input.name,
      tx,
    );
    await tx.insert(comptesStaff).values({
      id,
      betterAuthUserId: utilisateur.id,
      email: emailNormalise,
      telephone: telephoneAdmin === "" ? null : telephoneAdmin,
      role: "ADMIN_PRINCIPAL",
      etat: "VALIDE",
      creePar: invitation.creePar,
    });
    await tx
      .update(invitationsAgents)
      .set({ consommeLe: new Date(), consommePar: id })
      .where(eq(invitationsAgents.id, invitation.id));
    return utilisateur;
  });
  return { id, betterAuthUserId: user.id };
}

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
  if (input.password.length < 8) {
    throw new StaffError("MOT_DE_PASSE_INVALIDE", "mot de passe trop court");
  }
  const emailNormalise = normaliserEmailStaff(input.email);
  if (!emailNormalise) {
    throw new StaffError("EMAIL_INVALIDE", "email invalide");
  }
  const telephoneAgent = (input.telephone ?? "").trim();
  if (!telephoneStaffValide(telephoneAgent)) {
    throw new StaffError("TELEPHONE_INVALIDE", "numéro de téléphone invalide");
  }
  const id = randomUUID();
  const user = await db.transaction(async (tx) => {
    const utilisateur = await inscrireUtilisateur(
      emailNormalise,
      input.password,
      input.name,
      tx,
    );
    await tx.insert(comptesStaff).values({
      id,
      betterAuthUserId: utilisateur.id,
      email: emailNormalise,
      telephone: telephoneAgent === "" ? null : telephoneAgent,
      role: "AGENT",
      etat: "VALIDE",
      creePar: invitation.creePar,
    });
    await tx
      .update(invitationsAgents)
      .set({ consommeLe: new Date(), consommePar: id })
      .where(eq(invitationsAgents.id, invitation.id));
    await tracer(tx, {
      acteurId: id,
      roleAuMoment: "AGENT",
      typeAction: "agent.inscrire",
      entite: "compte_staff",
      entiteId: id,
      apres: { email: emailNormalise, invitation: invitation.id },
    });
    return utilisateur;
  });
  return { id, betterAuthUserId: user.id };
}

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
    await tracer(tx, {
      acteurId: modificateurId,
      roleAuMoment: modificateur.role,
      typeAction: "admin.modifier",
      entite: "compte_staff",
      entiteId: cible.id,
      avant,
      apres: { nom, telephone: telephoneValeur },
    });
  });
  return { id: cible.id, inchange: false as const };
}

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
    await tracer(tx, {
      acteurId: modificateurId,
      roleAuMoment: modificateur.role,
      typeAction: "agent.modifier",
      entite: "compte_staff",
      entiteId: cible.id,
      avant,
      apres: { nom, telephone: telephoneValeur },
    });
  });
  return { id: cible.id, inchange: false as const };
}

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
    throw new StaffError("EMAIL_INVALIDE", "email invalide");
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
      await tracer(tx, {
        acteurId: modificateurId,
        roleAuMoment: modificateur.role,
        typeAction: "agent.modifier",
        entite: "compte_staff",
        entiteId: cible.id,
        avant: { email: cible.email },
        apres: { email },
      });
    });
  } catch (erreur) {
    if (estDoublonEmail(erreur)) {
      throw new StaffError("EMAIL_DEJA_UTILISE", "email déjà utilisé");
    }
    throw erreur;
  }
  return { id: cible.id, inchange: false as const };
}

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
  await db.transaction(async (tx) => {
    await tx.insert(premiersAccesAdmin).values(acces);
    await tracer(tx, {
      acteurId: createurId,
      roleAuMoment: createur.role,
      typeAction: "agent.lien_mdp",
      entite: "compte_staff",
      entiteId: agentId,
      apres: { lien: acces.id, expireLe: acces.expireLe },
    });
  });
  return acces;
}

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
    if (lignesEcrites(resultat) !== 1) {
      throw new StaffError("NON_AUTORISE", "compte introuvable côté auth");
    }
    await tx
      .update(premiersAccesAdmin)
      .set({ consommeLe: new Date() })
      .where(eq(premiersAccesAdmin.id, acces.id));
  });
  return { id: acces.id };
}
