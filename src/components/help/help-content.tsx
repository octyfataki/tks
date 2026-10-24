import Link from "next/link";
import { ArrowUpRightIcon, CommandIcon } from "lucide-react";
import { AideExplorer } from "@/components/help/help-explorer";
import { Badge } from "@/components/ui/badge";
import {
  AIDE_ROLES,
  type AideNiveau,
  parcoursDuNiveau,
  reperesDuNiveau,
} from "@/lib/help-content";

export function AideContenu({ niveau }: { niveau: AideNiveau }) {
  const role = AIDE_ROLES[niveau];
  const parcours = parcoursDuNiveau(niveau);
  const reperes = reperesDuNiveau(niveau);
  const departs = role.depart.flatMap((id) => {
    const item = parcours.find((parcours) => parcours.id === id);
    return item?.lien
      ? [{ id: item.id, titre: item.titre, href: item.lien.href }]
      : [];
  });

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-6 border-b pb-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <Badge variant="outline" className="w-fit">
            Aide {role.niveau}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {role.titre}
          </h1>
          <p className="text-[15px] leading-relaxed text-foreground">
            {role.chapeau}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {role.intro}
          </p>
        </div>

        {departs.length > 0 ? (
          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-baseline sm:gap-6">
            <p className="shrink-0 text-xs font-medium text-muted-foreground">
              Commencez ici
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {departs.map((depart) => (
                <li key={depart.id}>
                  <Link
                    href={depart.href}
                    className="group inline-flex items-center gap-1 text-sm font-medium text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {depart.titre}
                    <ArrowUpRightIcon
                      aria-hidden
                      className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-px group-hover:translate-x-px"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

      <AideExplorer niveau={niveau} parcours={parcours} reperes={reperes} />

      <footer className="flex flex-col gap-2 border-t pt-4 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5">
          <CommandIcon aria-hidden className="size-3.5" />
          Ctrl+K ouvre la recherche de l’application, partout.
        </p>
        <p>
          Cette aide décrit uniquement les écrans de votre niveau. Le reste est
          annoncé sans lien mort.
        </p>
      </footer>
    </div>
  );
}
