import { headers } from "next/headers";
import { desc, eq, like, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { journalAudit } from "@/lib/db/schema/s2-autorisations";
import { peutConsulterJournal } from "@/lib/db/schema/s2-autorisations";
import { PermissionRefusee } from "@/components/permission-refusee";
import { Badge } from "@/components/ui/badge";

const LIGNES_PAR_PAGE = 50;

function dateHeure(valeur: Date): string {
  return valeur.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * /admin/journal — Lecture du journal d'audit : 50 derniers événements,
 * filtres acteur / type / entité (?acteur=, ?type=, ?entite=).
 * La consultation n'est pas journalisée (sinon boucle — S2 issue 01).
 * Append-only garanti par la base : ici, lecture seule, aucun bouton
 * d'écriture n'existe sur cette page.
 */
export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ acteur?: string; type?: string; entite?: string }>;
}) {
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

  const filtres = await searchParams;
  const fActeur = (filtres.acteur ?? "").trim();
  const fType = (filtres.type ?? "").trim();
  const fEntite = (filtres.entite ?? "").trim();

  const conditions = [];
  if (fActeur) conditions.push(eq(journalAudit.acteurId, fActeur));
  if (fType) conditions.push(like(journalAudit.typeAction, `%${fType}%`));
  if (fEntite) conditions.push(like(journalAudit.entite, `%${fEntite}%`));

  const evenements = await db
    .select()
    .from(journalAudit)
    .where(conditions.length > 0 ? or(...conditions) : undefined)
    .orderBy(desc(journalAudit.recuLe))
    .limit(LIGNES_PAR_PAGE);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4 sm:p-6">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Accès
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Journal d&apos;audit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {evenements.length} dernier{evenements.length > 1 ? "s" : ""} événement
          {evenements.length > 1 ? "s" : ""}. Append-only : ni modification ni
          suppression possibles, même en base.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="type"
          defaultValue={fType}
          placeholder="Type d'action (ex. permission…) "
          aria-label="Filtrer par type d'action"
          className="h-9 min-w-0 flex-1 basis-48 rounded-md border bg-background px-3 text-xs sm:max-w-xs"
        />
        <input
          type="search"
          name="entite"
          defaultValue={fEntite}
          placeholder="Entité (ex. permission…)"
          aria-label="Filtrer par entité"
          className="h-9 min-w-0 flex-1 basis-48 rounded-md border bg-background px-3 text-xs sm:max-w-xs"
        />
        <button
          type="submit"
          className="h-9 rounded-md border px-3 text-xs font-medium hover:bg-muted"
        >
          Filtrer
        </button>
        {fActeur || fType || fEntite ? (
          <a href="/admin/journal" className="inline-flex h-9 items-center text-xs underline-offset-4 hover:underline">
            Réinitialiser les filtres
          </a>
        ) : null}
      </form>

      {evenements.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">Aucun événement</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Les créations, révocations et permissions des agents y apparaissent dès qu&apos;elles ont lieu.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <caption className="sr-only">Événements d&apos;audit, plus récents d&apos;abord</caption>
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th scope="col" className="px-3 py-2.5 font-medium">Reçu le</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Action</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Entité</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Rôle</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Statut</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {evenements.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-3 py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">
                    {dateHeure(e.recuLe)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px]">{e.typeAction}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {e.entite}
                    {e.entiteId ? <span className="font-mono text-[11px]"> · {e.entiteId.slice(0, 8)}…</span> : null}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{e.roleAuMoment}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={e.statut === "REUSSIE" ? "secondary" : "destructive"}>
                      {e.statut}
                    </Badge>
                  </td>
                  <td className="max-w-48 truncate px-3 py-2.5 text-muted-foreground">
                    {e.motif || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
