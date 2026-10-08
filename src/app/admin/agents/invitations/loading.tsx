import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * /admin/agents/invitations — état de chargement dédié : même structure
 * que le registre (en-tête, barre d'outils en carte, tableau à 6
 * colonnes). Le skeleton hérité du segment parent montrait des cartes
 * agents — rien à voir avec cette page.
 */
export default function InvitationsAgentsChargement() {
  return (
    <div
      role="status"
      aria-label="Chargement des invitations agents"
      className="flex flex-1 flex-col gap-4 p-4 pt-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 min-w-0 flex-1 basis-52 sm:max-w-xs" />
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[680px] border-collapse text-left text-xs">
          <caption className="sr-only">Chargement des liens d&apos;invitation agents</caption>
          <thead>
            <tr className="border-b bg-muted/40">
              <th scope="col" className="w-8 px-2 py-2.5">
                <span className="sr-only">Détail</span>
              </th>
              <th scope="col" className="px-3 py-2.5">
                <Skeleton className="h-3.5 w-10" />
              </th>
              <th scope="col" className="px-3 py-2.5">
                <Skeleton className="h-3.5 w-10" />
              </th>
              <th scope="col" className="px-3 py-2.5">
                <Skeleton className="h-3.5 w-16" />
              </th>
              <th scope="col" className="hidden px-3 py-2.5 md:table-cell">
                <Skeleton className="h-3.5 w-20" />
              </th>
              <th scope="col" className="px-3 py-2.5">
                <Skeleton className="h-3.5 w-12" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-2 py-2.5">
                  <Skeleton className="size-6 rounded-md" />
                </td>
                <td className="max-w-60 px-3 py-2.5">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-32 max-w-full" />
                    <Skeleton className="h-3 w-48 max-w-full" />
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <Skeleton className="h-6 w-20 rounded" />
                </td>
                <td className="px-3 py-2.5">
                  <Skeleton className="h-3.5 w-24" />
                </td>
                <td className="hidden max-w-40 px-3 py-2.5 md:table-cell">
                  <Skeleton className="h-3.5 w-28 max-w-full" />
                </td>
                <td className="px-3 py-2.5">
                  <Skeleton className="h-7 w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
