import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

export function OrderBand({
  alerte,
  titre,
  detail,
  lien,
  libelle,
  compte,
}: {
  alerte: boolean;
  titre: string;
  detail: string;
  lien?: string;
  libelle?: string;
  compte?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-card px-3 py-2 text-xs">
      <span
        aria-hidden
        className={`size-1.5 shrink-0 rounded-full ${
          alerte ? "bg-amber-600" : "bg-muted-foreground/40"
        }`}
      />
      <span className="font-medium">{titre}</span>{" "}
      <span className="text-muted-foreground">{detail}</span>
      {lien && libelle ? (
        <Link
          href={lien}
          aria-label={`${libelle}, ${compte ?? 0} en attente`}
          className="group ml-auto inline-flex items-center overflow-hidden rounded-full border border-primary/50 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="py-1.5 pr-2 pl-3.5 text-xs font-medium">{libelle}</span>
          <span
            aria-hidden
            className="h-4 w-px border-l border-dashed border-primary/40"
          />
          <span className="flex items-center gap-1 py-1.5 pr-3 pl-2 text-xs font-semibold tabular-nums">
            {compte ?? 0}
            <ArrowUpRightIcon className="size-3.5 transition-transform motion-safe:group-hover:-translate-y-px motion-safe:group-hover:translate-x-px" />
          </span>
        </Link>
      ) : null}
    </div>
  );
}
