import Link from "next/link";
import type { ActiviteRecente } from "@/lib/authorizations/activite";
import { dateHeure } from "./dates";

export function BlocActiviteRecente({
  activite,
  journalAccessible,
}: {
  activite: ActiviteRecente[];
  journalAccessible: boolean;
}) {
  if (activite.length === 0) return null;

  return (
    <section aria-label="Activité récente" className="rounded-xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Activité récente</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Les dernières actions de ce compte.
        </p>
      </div>
      <div className="-mx-4 -mb-1 mt-3 overflow-x-auto border-t">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">
            Dernières actions de ce compte, reçues par le journal d&apos;audit
          </caption>
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 font-medium">
                Reçu le
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {activite.map((ligne) => (
              <tr key={ligne.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-2.5 align-top whitespace-nowrap tabular-nums text-muted-foreground">
                  {dateHeure(ligne.recuLe)}
                </td>
                <td className="max-w-72 px-3 py-2.5 font-medium break-words">
                  {ligne.resume}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {journalAccessible ? (
        <Link
          href="/admin/audit-log"
          className="mt-3 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Voir le journal d&apos;audit
        </Link>
      ) : null}
    </section>
  );
}
