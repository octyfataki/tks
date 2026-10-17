import { and, eq } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import {
  permissionsAgents,
  permissionsSocleAgents,
  estPermissionConnue,
  peutGererPermissions,
  PROFIL_AGENT_SERVICE_DEFAUT,
  type Permission,
} from "@/lib/db/schema/authorizations";
import { enregistrerEvenement, ERREUR_CONTESTEE_INTROUVABLE } from "./journal";

export type ErreurAutorisation =
  | "NON_AUTORISE"
  | "PERMISSION_INCONNUE"
  | "AGENT_INTROUVABLE"
  | "DEJA_ACCORDEE"
  | "NON_ACCORDEE"
  | "CONTESTEE_INTROUVABLE"
  | "JOURNAL_INDISPONIBLE";

export class AutorisationError extends Error {
  code: ErreurAutorisation;
  constructor(code: ErreurAutorisation, message: string) {
    super(message);
    this.code = code;
  }
}

async function tracer(
  ex: ExecuteurDb,
  evenement: Parameters<typeof enregistrerEvenement>[0],
): Promise<void> {
  const trace = await enregistrerEvenement(evenement, ex);
  if (!trace.ok) {
    if (trace.erreur === ERREUR_CONTESTEE_INTROUVABLE) {
      throw new AutorisationError(
        "CONTESTEE_INTROUVABLE",
        ERREUR_CONTESTEE_INTROUVABLE,
      );
    }
    throw new AutorisationError("JOURNAL_INDISPONIBLE", "journal indisponible");
  }
}

function estDoublon(erreur: unknown): boolean {
  const code = (erreur as { code?: unknown })?.code;
  if (code === "ER_DUP_ENTRY") return true;
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  return message.includes("Duplicate entry");
}

async function staffParId(id: string) {
  const lignes = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, id))
    .limit(1);
  return lignes[0] ?? null;
}

export async function listerSocle(): Promise<Permission[]> {
  const lignes = await db
    .select({ permission: permissionsSocleAgents.permission })
    .from(permissionsSocleAgents);
  return lignes
    .map((l) => l.permission)
    .filter(estPermissionConnue)
    .sort();
}

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

async function aPermissionSocle(permission: string): Promise<boolean> {
  const lignes = await db
    .select({ permission: permissionsSocleAgents.permission })
    .from(permissionsSocleAgents)
    .where(eq(permissionsSocleAgents.permission, permission))
    .limit(1);
  return lignes.length > 0;
}

export async function aPermission(
  agentId: string,
  permission: string,
): Promise<boolean> {
  if (!estPermissionConnue(permission)) return false;
  if (await aPermissionSocle(permission)) return true;
  return aPermissionIndividuelle(agentId, permission);
}

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
  await db.transaction(async (tx) => {
    await tx.insert(permissionsAgents).values({
      agentId,
      permission,
      accordePar: gestionnaireId,
    });
    await tracer(tx, {
      acteurId: gestionnaireId,
      roleAuMoment: gerant.role,
      typeAction: "permission.accorder",
      entite: "permission",
      entiteId: `${agentId}:${permission}`,
      apres: { agentId, permission },
    });
  });
}

export async function retirerPermission(
  gestionnaireId: string,
  agentId: string,
  permission: string,
  options?: { contesteId?: string | null },
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
  await db.transaction(async (tx) => {
    await tx
      .delete(permissionsAgents)
      .where(
        and(
          eq(permissionsAgents.agentId, agentId),
          eq(permissionsAgents.permission, permission),
        ),
      );
    await tracer(tx, {
      acteurId: gestionnaireId,
      roleAuMoment: gerant.role,
      typeAction: "permission.retirer",
      entite: "permission",
      entiteId: `${agentId}:${permission}`,
      avant: { agentId, permission },
      contesteId: options?.contesteId ?? null,
    });
  });
}

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
  await db.transaction(async (tx) => {
    await tx.insert(permissionsSocleAgents).values({
      permission,
      accordePar: gestionnaireId,
    });
    await tracer(tx, {
      acteurId: gestionnaireId,
      roleAuMoment: gerant.role,
      typeAction: "permission.socle.accorder",
      entite: "permission_socle",
      entiteId: permission,
      apres: { permission },
    });
  });
}

export async function retirerSocle(
  gestionnaireId: string,
  permission: string,
  options?: { contesteId?: string | null },
): Promise<void> {
  if (!estPermissionConnue(permission)) {
    throw new AutorisationError("PERMISSION_INCONNUE", "permission inconnue");
  }
  const gerant = await gerantValide(gestionnaireId);
  if (!(await aPermissionSocle(permission))) {
    throw new AutorisationError("NON_ACCORDEE", "permission hors socle");
  }
  await db.transaction(async (tx) => {
    await tx
      .delete(permissionsSocleAgents)
      .where(eq(permissionsSocleAgents.permission, permission));
    await tracer(tx, {
      acteurId: gestionnaireId,
      roleAuMoment: gerant.role,
      typeAction: "permission.socle.retirer",
      entite: "permission_socle",
      entiteId: permission,
      avant: { permission },
      contesteId: options?.contesteId ?? null,
    });
  });
}

export async function appliquerProfilAgent(
  gestionnaireId: string,
  agentId: string,
): Promise<{ ajoutees: Permission[] }> {
  const gerant = await gerantValide(gestionnaireId);
  await agentValide(agentId);
  const detenues = new Set(await listerPermissionsEffectives(agentId));
  const manquantes = PROFIL_AGENT_SERVICE_DEFAUT.filter((p) => !detenues.has(p));
  const ajoutees = await db.transaction(async (tx) => {
    const persistees: Permission[] = [];
    for (const permission of manquantes) {
      try {
        await tx.insert(permissionsAgents).values({
          agentId,
          permission,
          accordePar: gestionnaireId,
        });
        persistees.push(permission);
      } catch (erreur) {
        if (!estDoublon(erreur)) throw erreur;
      }
    }
    await tracer(tx, {
      acteurId: gestionnaireId,
      roleAuMoment: gerant.role,
      typeAction: "permission.profil",
      entite: "permission",
      entiteId: agentId,
      apres: { agentId, ajoutees: persistees },
    });
    return persistees;
  });
  return { ajoutees };
}
