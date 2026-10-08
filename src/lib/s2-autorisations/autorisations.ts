import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import {
  permissionsAgents,
  estPermissionConnue,
  peutGererPermissions,
  PROFIL_AGENT_SERVICE_DEFAUT,
  type Permission,
} from "@/lib/db/schema/s2-autorisations";
import { enregistrerEvenement } from "./journal";

// S2 issues 02-03 — accorder / retirer / vérifier, une par une.
// Absence = refus. Permission inconnue = refus. Zéro par défaut.

export type ErreurAutorisation =
  | "NON_AUTORISE"
  | "PERMISSION_INCONNUE"
  | "AGENT_INTROUVABLE"
  | "DEJA_ACCORDEE"
  | "NON_ACCORDEE";

export class AutorisationError extends Error {
  code: ErreurAutorisation;
  constructor(code: ErreurAutorisation, message: string) {
    super(message);
    this.code = code;
  }
}

async function staffParId(id: string) {
  const lignes = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, id))
    .limit(1);
  return lignes[0] ?? null;
}

/** Vérifie qu'un agent tient une permission (inconnue = faux). */
export async function aPermission(
  agentId: string,
  permission: string,
): Promise<boolean> {
  if (!estPermissionConnue(permission)) return false;
  const lignes = await db
    .select({ permission: permissionsAgents.permission })
    .from(permissionsAgents)
    .where(
      and(
        eq(permissionsAgents.agentId, agentId),
        eq(permissionsAgents.permission, permission),
      ),
    )
    .limit(1);
  return lignes.length > 0;
}

/** Liste exacte des permissions d'un agent (vide par défaut). */
export async function listerPermissions(agentId: string): Promise<Permission[]> {
  const lignes = await db
    .select({ permission: permissionsAgents.permission })
    .from(permissionsAgents)
    .where(eq(permissionsAgents.agentId, agentId));
  return lignes
    .map((l) => l.permission)
    .filter(estPermissionConnue)
    .sort();
}

async function gerantValide(gestionnaireId: string) {
  const gerant = await staffParId(gestionnaireId);
  if (!gerant || !peutGererPermissions(gerant.role, gerant.etat)) {
    throw new AutorisationError("NON_AUTORISE", "gestionnaire non autorisé");
  }
  return gerant;
}

async function agentValide(agentId: string) {
  const agent = await staffParId(agentId);
  if (!agent || agent.role !== "AGENT") {
    throw new AutorisationError("AGENT_INTROUVABLE", "agent introuvable");
  }
  return agent;
}

/** Accorde une permission à un agent précis. Chaque geste est journalisé. */
export async function accorderPermission(
  gestionnaireId: string,
  agentId: string,
  permission: string,
): Promise<void> {
  if (!estPermissionConnue(permission)) {
    throw new AutorisationError("PERMISSION_INCONNUE", "permission inconnue");
  }
  const gerant = await gerantValide(gestionnaireId);
  await agentValide(agentId);
  if (await aPermission(agentId, permission)) {
    throw new AutorisationError("DEJA_ACCORDEE", "déjà accordée");
  }
  await db.insert(permissionsAgents).values({
    agentId,
    permission,
    accordePar: gestionnaireId,
  });
  await enregistrerEvenement({
    acteurId: gestionnaireId,
    roleAuMoment: gerant.role,
    typeAction: "permission.accorder",
    entite: "permission",
    entiteId: `${agentId}:${permission}`,
    apres: { agentId, permission },
  });
}

/** Retire une permission. Le retrait fait foi : le profil ne réaccorde rien. */
export async function retirerPermission(
  gestionnaireId: string,
  agentId: string,
  permission: string,
): Promise<void> {
  if (!estPermissionConnue(permission)) {
    throw new AutorisationError("PERMISSION_INCONNUE", "permission inconnue");
  }
  const gerant = await gerantValide(gestionnaireId);
  await agentValide(agentId);
  if (!(await aPermission(agentId, permission))) {
    throw new AutorisationError("NON_ACCORDEE", "permission non accordée");
  }
  await db
    .delete(permissionsAgents)
    .where(
      and(
        eq(permissionsAgents.agentId, agentId),
        eq(permissionsAgents.permission, permission),
      ),
    );
  await enregistrerEvenement({
    acteurId: gestionnaireId,
    roleAuMoment: gerant.role,
    typeAction: "permission.retirer",
    entite: "permission",
    entiteId: `${agentId}:${permission}`,
    avant: { agentId, permission },
  });
}

/**
 * Applique le profil prédéfini d'embauche : insère les permissions
 * manquantes, sans toucher aux autres. Raccourci, pas contrainte.
 */
export async function appliquerProfilAgent(
  gestionnaireId: string,
  agentId: string,
): Promise<{ ajoutees: Permission[] }> {
  const gerant = await gerantValide(gestionnaireId);
  await agentValide(agentId);
  const detenues = new Set(await listerPermissions(agentId));
  const ajoutees = PROFIL_AGENT_SERVICE_DEFAUT.filter((p) => !detenues.has(p));
  for (const permission of ajoutees) {
    await db.insert(permissionsAgents).values({
      agentId,
      permission,
      accordePar: gestionnaireId,
    });
  }
  await enregistrerEvenement({
    acteurId: gestionnaireId,
    roleAuMoment: gerant.role,
    typeAction: "permission.profil",
    entite: "permission",
    entiteId: agentId,
    apres: { agentId, ajoutees },
  });
  return { ajoutees };
}
