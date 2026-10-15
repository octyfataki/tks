import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type OngletAdmin = {
  cle: string;
  etiquette: string;
  total: number;
  href: string;
  actif: boolean;
};

/**
 * Onglets à compteurs (état dans l'URL, partageable) + recherche serveur
 * (?q= sur nom, email, téléphone). Présentation pure : les totaux et les
 * hrefs sont calculés par la page.
 */
export function FiltresAdmins({
  onglets,
  recherche,
  conserves,
}: {
  onglets: OngletAdmin[];
  recherche: string;
  /** Paramètres à conserver quand on cherche (rôle, état). */
  conserves: { role?: string; etat?: string };
}) {
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Filtrer par groupe" className="flex flex-wrap gap-x-5 gap-y-1 border-b">
        {onglets.map((onglet) => (
          <Link
            key={onglet.cle}
            href={onglet.href}
            aria-current={onglet.actif ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-0.5 pb-2 text-xs",
              onglet.actif
                ? "border-primary font-medium text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {onglet.etiquette}{" "}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                onglet.actif ? "bg-primary/10" : "bg-muted",
              )}
            >
              {onglet.total}
            </span>
          </Link>
        ))}
      </nav>
      <form
        action="/admin/list"
        method="get"
        role="search"
        className="flex flex-wrap items-center gap-2"
      >
        {conserves.role ? (
          <input type="hidden" name="role" value={conserves.role} />
        ) : null}
        {conserves.etat ? (
          <input type="hidden" name="etat" value={conserves.etat} />
        ) : null}
        <div className="group relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={recherche}
            placeholder="Rechercher nom, email, téléphone…"
            aria-label="Rechercher un administrateur"
            className="pl-8"
          />
        </div>
        {recherche ? (
          <Link
            href="/admin/list"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Effacer
          </Link>
        ) : null}
      </form>
    </div>
  );
}
