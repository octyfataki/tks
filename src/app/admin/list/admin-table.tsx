import Link from "next/link";
import { ShieldAlertIcon, UserSearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LigneAdmin } from "./types";

function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/);
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return `${mots[0][0]}${mots[mots.length - 1][0]}`.toUpperCase();
}

function pastilleRole(role: LigneAdmin["role"]): string {
  return role === "ADMIN_PRINCIPAL"
    ? "bg-primary/10 text-primary"
    : "bg-muted text-muted-foreground";
}

function pagesAutour(page: number, totalPages: number): (number | "…")[] {
  const proches = new Set([1, totalPages, page - 1, page, page + 1]);
  const triees = [...proches].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const sortie: (number | "…")[] = [];
  for (const p of triees) {
    if (sortie.length > 0 && p - (sortie[sortie.length - 1] as number) > 1) sortie.push("…");
    sortie.push(p);
  }
  return sortie;
}

/**
 * Tableau des administrateurs + pagination (?page=) + état vide.
 * Colonnes réduites sur mobile (téléphone et créateur masqués).
 */
export function TableauAdmins({
  lignes,
  page,
  totalPages,
  lienPage,
  recherche,
}: {
  lignes: LigneAdmin[];
  page: number;
  totalPages: number;
  lienPage: (page: number) => string;
  recherche: string;
}) {
  if (lignes.length === 0) {
    return (
      <div role="status" className="flex flex-col items-center gap-2 rounded-xl border bg-card px-4 py-12 text-center">
        <UserSearchIcon className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          {recherche ? "Aucun administrateur trouvé" : "Aucun administrateur"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {recherche
            ? `Rien ne correspond à « ${recherche} ». Essayez un autre nom, email ou numéro.`
            : "Créez le premier compte pour voir la liste se remplir."}
        </p>
        <Button size="sm" className="mt-2" render={<Link href="/admin/create" />}>
          Créer un administrateur principal
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <caption className="sr-only">
            Liste des administrateurs, page {page} sur {totalPages}
          </caption>
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground">
              <th scope="col" className="px-3 py-2.5 font-medium">Admin</th>
              <th scope="col" className="hidden px-3 py-2.5 font-medium lg:table-cell">Téléphone</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Rôle</th>
              <th scope="col" className="px-3 py-2.5 font-medium">État</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Créé le</th>
              <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">Créé par</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lignes.map((ligne) => (
              <tr key={ligne.id} className="transition-colors hover:bg-muted/30">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
                    >
                      {initiales(ligne.nom)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{ligne.nom}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {ligne.email}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 text-muted-foreground tabular-nums lg:table-cell">
                  {ligne.telephone ?? "—"}
                </td>
                <td className="px-3 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", pastilleRole(ligne.role))}>
                    {ligne.role === "ADMIN_PRINCIPAL" ? "Principal" : "Technique"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap",
                      ligne.etat === "VALIDE" ? "text-green-700" : "text-muted-foreground",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 rounded-full",
                        ligne.etat === "VALIDE" ? "bg-green-600" : "bg-muted-foreground",
                      )}
                    />
                    {ligne.etat === "VALIDE" ? "Valide" : "Révoqué"}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                  {new Date(ligne.creeLe).toLocaleDateString("fr-CD")}
                </td>
                <td className="hidden max-w-44 truncate px-3 py-2.5 text-muted-foreground md:table-cell">
                  {ligne.creePar ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-2">
          {page > 1 ? (
            <Button size="sm" variant="outline" render={<Link href={lienPage(page - 1)} />}>
              ← Précédent
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1">
            {pagesAutour(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`vide-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
              ) : (
                <Link
                  key={p}
                  href={lienPage(p)}
                  aria-current={p === page ? "page" : undefined}
                  aria-label={`Page ${p}`}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs tabular-nums",
                    p === page
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {p}
                </Link>
              ),
            )}
          </div>
          {page < totalPages ? (
            <Button size="sm" variant="outline" render={<Link href={lienPage(page + 1)} />}>
              Suivant →
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}

export function EtatSansAcces() {
  return (
    <div role="alert" className="flex items-center gap-2 rounded-xl border bg-card p-4 text-xs text-muted-foreground">
      <ShieldAlertIcon className="size-4 shrink-0" />
      Réservé aux administrateurs validés.
    </div>
  );
}
