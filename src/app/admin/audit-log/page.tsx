import { headers } from "next/headers";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesClients, comptesStaff } from "@/lib/db/schema/accounts";
import { journalAudit } from "@/lib/db/schema/authorizations";
import { peutConsulterJournal } from "@/lib/db/schema/authorizations";
import {
  nomEntite,
  resumerEvenement,
} from "@/lib/authorizations/journal-summary";
import { PermissionRefusee } from "@/components/permission-refusee";
import { Badge } from "@/components/ui/badge";
import { RegistreJournal, type LigneJournal } from "./registre-journal";

const LIGNES = 50;

function texteJson(valeur: unknown): string | null {
  if (valeur === null || valeur === undefined) return null;
  try {
    return JSON.stringify(valeur, null, 2);
  } catch {
    return String(valeur);
  }
}

/**
 * /admin/audit-log — Lecture du journal d'audit : les 50 derniers événements,
 * dans le même dessin que les registres d'invitations (barre d'outils en
 * carte, tableau à lignes dépliables, pagination locale).
 * La consultation n'est pas journalisée (sinon boucle — S2 issue 01).
 * Append-only garanti par la base : lecture seule, aucun bouton d'écriture.
 */
export default async function JournalPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignesMoi = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignesMoi[0];
  if (!moi || !peutConsulterJournal(moi.role, moi.etat)) {
    return (
      <PermissionRefusee
        titre="Journal d'audit"
        detail="Seul un administrateur principal ou technique validé consulte le journal."
        action="Votre rôle ne permet pas de consulter le journal d'audit."
      />
    );
  }

  const evenements = await db
    .select()
    .from(journalAudit)
    .orderBy(desc(journalAudit.recuLe))
    .limit(LIGNES);

  // S2 issue 15 — fil « erreur → correction ». Les corrections des lignes
  // affichées (leurs `conteste_id` pointent vers elles) et les lignes
  // contestées par les corrections affichées (hors fenêtre des 50 si
  // anciennes) sont chargées avec, pour que le fil se remonte dans les deux
  // sens sans deviner. Lecture seule, comme le reste de la page.
  const idsAffiches = evenements.map((e) => e.id);
  const lignesCorrections =
    idsAffiches.length > 0
      ? await db
          .select({ id: journalAudit.id, contesteId: journalAudit.contesteId })
          .from(journalAudit)
          .where(inArray(journalAudit.contesteId, idsAffiches))
      : [];
  const nbCorrections = new Map<string, number>();
  for (const c of lignesCorrections) {
    if (c.contesteId) {
      nbCorrections.set(c.contesteId, (nbCorrections.get(c.contesteId) ?? 0) + 1);
    }
  }
  const idsContesteesManquantes = [
    ...new Set(
      evenements
        .map((e) => e.contesteId)
        .filter(
          (id): id is string => !!id && !idsAffiches.includes(id),
        ),
    ),
  ];
  const lignesContestees =
    idsContesteesManquantes.length > 0
      ? await db
          .select()
          .from(journalAudit)
          .where(inArray(journalAudit.id, idsContesteesManquantes))
      : [];
  const toutes = [...lignesContestees, ...evenements];

  // S2-05 (issue #13) — résolution des identités à la lecture (aucune
  // écriture au journal, schéma inchangé). `acteurId` vise `comptes_staff.id` ;
  // le nom affichable vit sur `user` via `betterAuthUserId` (même pattern que
  // lireTauxDuJour). Les identifiants concernés (agent visé, compte client
  // visé) sont résolus dans les mêmes requêtes pour formuler le résumé.
  const idsActeurs = [
    ...new Set(
      toutes.map((e) => e.acteurId).filter((id): id is string => !!id),
    ),
  ];
  const idsAgentsConcernes = new Set<string>();
  for (const e of toutes) {
    for (const champ of [e.avant, e.apres]) {
      if (champ && typeof champ === "object" && !Array.isArray(champ)) {
        const agentId = (champ as Record<string, unknown>)["agentId"];
        if (typeof agentId === "string" && agentId) idsAgentsConcernes.add(agentId);
      }
    }
    if (e.entite === "permission" && e.entiteId?.includes(":")) {
      const agentId = e.entiteId.split(":")[0];
      if (agentId) idsAgentsConcernes.add(agentId);
    }
    if (
      (e.entite === "compte_staff" ||
        e.entite === "permission") &&
      e.entiteId &&
      !e.entiteId.includes(":")
    ) {
      idsAgentsConcernes.add(e.entiteId);
    }
  }
  const idsStaff = [...new Set([...idsActeurs, ...idsAgentsConcernes])];
  const lignesStaff =
    idsStaff.length > 0
      ? await db
          .select({
            id: comptesStaff.id,
            email: comptesStaff.email,
            nom: user.name,
          })
          .from(comptesStaff)
          .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
          .where(inArray(comptesStaff.id, idsStaff))
      : [];
  const nomsStaff = new Map(
    lignesStaff.map((l) => [l.id, l.nom ?? l.email] as const),
  );
  const emailsStaff = new Map(lignesStaff.map((l) => [l.id, l.email] as const));

  const idsClients = [
    ...new Set(
      toutes
        .filter((e) => e.entite === "compte_client" && e.entiteId)
        .map((e) => e.entiteId as string),
    ),
  ];
  const lignesClients =
    idsClients.length > 0
      ? await db
          .select({ id: comptesClients.id, telephone: comptesClients.telephone })
          .from(comptesClients)
          .where(inArray(comptesClients.id, idsClients))
      : [];
  const telephonesClients = new Map(
    lignesClients.map((l) => [l.id, l.telephone] as const),
  );

  const lignes: LigneJournal[] = toutes.map((e) => {
    const auteurNom = e.acteurId
      ? (nomsStaff.get(e.acteurId) ?? null)
      : null;
    const resume = resumerEvenement(
      {
        typeAction: e.typeAction,
        entite: e.entite,
        avant: e.avant,
        apres: e.apres,
        motif: e.motif,
      },
      nomsStaff,
    );
    // Libellé de l'enregistrement visé : nom ou téléphone résolu quand il
    // existe, identifiant brut sinon (jamais inventé).
    let entiteLibelle = nomEntite(e.entite);
    if (e.entite === "compte_client" && e.entiteId) {
      const telephone = telephonesClients.get(e.entiteId);
      entiteLibelle = telephone
        ? `Compte client • ${telephone}`
        : `Compte client • ${e.entiteId.slice(0, 8)}…`;
    } else if (e.entiteId && e.entiteId.includes(":")) {
      const [agentId, permission] = e.entiteId.split(":");
      const nom = nomsStaff.get(agentId) ?? `${agentId.slice(0, 8)}…`;
      entiteLibelle = `${nomEntite(e.entite)} • ${nom} • ${permission}`;
    } else if (e.entiteId && nomsStaff.has(e.entiteId)) {
      entiteLibelle = `${nomEntite(e.entite)} • ${nomsStaff.get(e.entiteId)}`;
    }
    return {
      id: e.id,
      acteurId: e.acteurId,
      auteurNom,
      auteurEmail: e.acteurId
        ? (emailsStaff.get(e.acteurId) ?? null)
        : null,
      role: e.roleAuMoment,
      typeAction: e.typeAction,
      entite: e.entite,
      entiteId: e.entiteId,
      entiteLibelle,
      resume,
      avant: texteJson(e.avant),
      apres: texteJson(e.apres),
      appareilId: e.appareilId,
      ecritLe: e.horodatageLocal.toISOString(),
      recuLe: e.recuLe.toISOString(),
      statut: e.statut,
      motif: e.motif,
      contesteId: e.contesteId,
      nbCorrections: nbCorrections.get(e.id) ?? 0,
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            Journal d&apos;audit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre scellé : ni modification ni suppression possibles, même
            en base. Les {LIGNES} dernières lignes reçues, heures de Kinshasa
            — plus leurs corrections liées, même anciennes.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          Lecture seule
        </Badge>
      </div>
      <RegistreJournal lignes={lignes} />
    </div>
  );
}
