import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import type { ActiviteRecente } from "@/lib/authorizations/activite";
import { dateHeure } from "./dates";

export function BlocActiviteRecente({ activite }: { activite: ActiviteRecente[] }) {
  if (activite.length === 0) return null;

  return (
    <section aria-label="Activité récente" className="rounded-xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Activité récente</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Les dernières actions de ce compte.
        </p>
      </div>
      <Separator className="mt-2" />
      <ol className="mt-4 flex flex-col gap-2">
        {activite.map((ligne) => (
          <li
            key={ligne.id}
            className="min-w-0 rounded-lg border px-3 py-2 text-xs"
          >
            <p className="break-words font-medium">{ligne.resume}</p>
            <p className="mt-0.5 text-muted-foreground tabular-nums">
              {dateHeure(ligne.ecritLe)}
            </p>
          </li>
        ))}
      </ol>
      <Link
        href="/admin/audit-log"
        className="mt-3 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
        Voir le journal d&apos;audit
      </Link>
    </section>
  );
}
