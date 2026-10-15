import { Skeleton } from "@/components/ui/skeleton";

/**
 * /admin/audit-log — état de chargement : même structure que la page
 * (titre, barre d'outils, tableau du registre, pagination).
 */
export default function JournalChargement() {
  return (
    <div
      role="status"
      aria-label="Chargement du journal d'audit"
      className="flex flex-1 flex-col gap-4 p-4 pt-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-2xl flex-1 flex-col gap-1.5">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
      </div>
      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <Skeleton className="h-9 min-w-0 flex-1 basis-52 sm:max-w-xs" />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="size-6 shrink-0 rounded-md" />
              <Skeleton className="h-4 w-24 shrink-0" />
              <div className="flex min-w-0 max-w-64 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="hidden h-4 w-32 shrink-0 sm:block" />
              <Skeleton className="hidden h-4 w-20 shrink-0 md:block" />
              <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
              <Skeleton className="hidden h-4 w-24 shrink-0 lg:block" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  );
}
