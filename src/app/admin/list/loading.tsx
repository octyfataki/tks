import { Skeleton } from "@/components/ui/skeleton";

/**
 * /admin/list — état de chargement : même structure que la page
 * (titre, barre d'outils, grille de cartes, pagination).
 */
export default function ListeAdminsChargement() {
  return (
    <div
      role="status"
      aria-label="Chargement de la liste des administrateurs"
      className="flex flex-1 flex-col gap-4 p-4 pt-4"
    >
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-[52px] w-full rounded-lg" />
      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-32 max-w-full" />
                <Skeleton className="h-3 w-48 max-w-full" />
              </div>
              <Skeleton className="size-10 shrink-0 rounded-lg" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  );
}
