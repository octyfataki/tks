import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import {
  permissionsAgents,
  permissionsSocleAgents,
  estPermissionConnue,
  peutGererPermissions,
  PROFIL_AGENT_SERVICE_DEFAUT,
  type Permission,
} from "@/lib/db/schema/s2-autorisations";
import { enregistrerEvenement } from "./journal";

// S2 issues 02-03 — socle global + individuel, une par une.
// Effectif = socle ∪ individuel. Absence des deux = refus.
// Permission inconnue = refus. Un agent créé n'a rien en individuel.

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

/** Socle global : les permissions accordées à tous les agents. */
export async function listerSocle(): Promise<Permission[]> {
  const lignes = await db
    .select({ permission: permissionsSocleAgents.permission })
    .from(permissionsSocleAgents);
  return lignes
    .map((l) => l.permission)
    .filter(estPermissionConnue)
    .sort();
}

/** L'agent tient-il la permission en individuel (hors socle) ? */
async function aPermissionIndividuelle(
  agentId: string,
  permission: string,
): Promise<boolean> {
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

/** Le socle accorde-t-il cette permission à tous ? */
async function aPermissionSocle(permission: string): Promise<boolean> {
  const lignes = await db
    .select({ permission: permissionsSocleAgents.permission })
    .from(permissionsSocleAgents)
    .where(eq(permissionsSocleAgents.permission, permission))
    .limit(1);
  return lignes.length > 0;
}

/** Vérifie qu'un agent tient une permission (socle ou individuel, inconnue = faux). */
export async function aPermission(
  agentId: string,
  permission: string,
): Promise<boolean> {
  if (!estPermissionConnue(permission)) return false;
  if (await aPermissionSocle(permission)) return true;
  return aPermissionIndividuelle(agentId, permission);
}

/** Permissions individuelles d'un agent (hors socle, vide par défaut). */
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

/** Permissions effectives d'un agent : socle ∪ individuel. */
export async function listerPermissionsEffectives(
  agentId: string,
): Promise<Permission[]> {
  const [socle, individuelles] = await Promise.all([
    listerSocle(),
    listerPermissions(agentId),
  ]);
  return [...new Set([...socle, ...individuelles])].sort();
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
  if (await aPermissionIndividuelle(agentId, permission)) {
    throw new AutorisationError("DEJA_ACCORDEE", "déjà accordée");
  }
  if (await aPermissionSocle(permission)) {
    throw new AutorisationError(
      "DEJA_ACCORDEE",
      "déjà accordée par le socle à tous les agents",
    );
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

/**
 * Retire une permission individuelle. Ne touche jamais au socle : une
 * permission du socle reste accordée à tous — pour la retirer à un seul
 * agent, retirez-la du socle (page globale) ou assumez l'addition.
 */
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
  if (!(await aPermissionIndividuelle(agentId, permission))) {
    if (await aPermissionSocle(permission)) {
      throw new AutorisationError(
        "NON_ACCORDEE",
        "permission du socle : elle s'applique à tous, modifiez le socle",
      );
    }
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

/** Accorde une permission du socle à tous les agents (y compris futurs). */
export async function accorderSocle(
  gestionnaireId: string,
  permission: string,
): Promise<void> {
  if (!estPermissionConnue(permission)) {
    throw new AutorisationError("PERMISSION_INCONNUE", "permission inconnue");
  }
  const gerant = await gerantValide(gestionnaireId);
  if (await aPermissionSocle(permission)) {
    throw new AutorisationError("DEJA_ACCORDEE", "déjà au socle");
  }
  await db.insert(permissionsSocleAgents).values({
    permission,
    accordePar: gestionnaireId,
  });
  await enregistrerEvenement({
    acteurId: gestionnaireId,
    roleAuMoment: gerant.role,
    typeAction: "permission.socle.accorder",
    entite: "permission_socle",
    entiteId: permission,
    apres: { permission },
  });
}

/** Retire une permission du socle (tous les agents la perdent, sauf exception individuelle). */
export async function retirerSocle(
  gestionnaireId: string,
  permission: string,
): Promise<void> {
  if (!estPermissionConnue(permission)) {
    throw new AutorisationError("PERMISSION_INCONNUE", "permission inconnue");
  }
  const gerant = await gerantValide(gestionnaireId);
  if (!(await aPermissionSocle(permission))) {
    throw new AutorisationError("NON_ACCORDEE", "permission hors socle");
  }
  await db
    .delete(permissionsSocleAgents)
    .where(eq(permissionsSocleAgents.permission, permission));
  await enregistrerEvenement({
    acteurId: gestionnaireId,
    roleAuMoment: gerant.role,
    typeAction: "permission.socle.retirer",
    entite: "permission_socle",
    entiteId: permission,
    avant: { permission },
  });
}

/**
 * Applique le profil prédéfini d'embauche : insère les permissions
 * manquantes à l'effectif (socle ∪ individuel), sans toucher aux autres.
 * Raccourci, pas contrainte.
 */
export async function appliquerProfilAgent(
  gestionnaireId: string,
  agentId: string,
): Promise<{ ajoutees: Permission[] }> {
  const gerant = await gerantValide(gestionnaireId);
  await agentValide(agentId);
  const detenues = new Set(await listerPermissionsEffectives(agentId));
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
