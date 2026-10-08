import Link from "next/link";
import { desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { journalAudit } from "@/lib/db/schema/s2-autorisations";
import { Badge } from "@/components/ui/badge";

const EVENEMENTS_PAR_FICHE = 50;

function dateHeure(valeur: Date): string {
  return valeur.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Historique d'un agent de service : les événements du journal d'audit
 * qui le concernent (entité) ou qu'il a lui-même provoqués (acteur :
 * inscription par lien, par exemple), plus récents d'abord. Lecture
 * seule — l'append-only reste garanti par la base, comme sur /admin/journal.
 */
export async function HistoriqueAgent({ agentId }: { agentId: string }) {
  const evenements = await db
    .select()
    .from(journalAudit)
    .where(
      or(
        eq(journalAudit.entiteId, agentId),
        eq(journalAudit.acteurId, agentId),
      ),
    )
    .orderBy(desc(journalAudit.recuLe))
    .limit(EVENEMENTS_PAR_FICHE);

  const idsActeurs = [
    ...new Set(
      evenements.map((e) => e.acteurId).filter((v): v is string => v !== null),
    ),
  ];
  const acteurs =
    idsActeurs.length > 0
      ? await db
          .select({
            id: comptesStaff.id,
            email: comptesStaff.email,
            nom: user.name,
          })
          .from(comptesStaff)
          .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
          .where(inArray(comptesStaff.id, idsActeurs))
      : [];
  const nomActeur = new Map(
    acteurs.map((a) => [a.id, a.nom?.trim() || a.email]),
  );

  if (evenements.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm font-medium">Aucune activité tracée</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Création, permissions, suspensions et révocations y apparaissent dès
          qu&apos;elles ont lieu.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[680px] border-collapse text-left text-xs">
          <caption className="sr-only">
            Activité de l&apos;agent, plus récente d&apos;abord
          </caption>
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground">
              <th scope="col" className="px-3 py-2.5 font-medium">Reçu le</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Action</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Par</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Rôle</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {evenements.map((e) => (
              <tr key={e.id} className="transition-colors hover:bg-muted/30">
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">
                  {dateHeure(e.recuLe)}
                </td>
                <td className="px-3 py-2.5 font-mono text-[11px]">{e.typeAction}</td>
                <td className="max-w-44 truncate px-3 py-2.5 text-muted-foreground">
                  {e.acteurId === agentId
                    ? "Lui-même"
                    : (e.acteurId ? nomActeur.get(e.acteurId) : null) || "Système"}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{e.roleAuMoment}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={e.statut === "REUSSIE" ? "secondary" : "destructive"}>
                    {e.statut}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        href={`/admin/journal?acteur=${agentId}`}
        className="self-end text-xs underline-offset-4 hover:underline"
      >
        Voir dans le journal complet
      </Link>
    </div>
  );
}
