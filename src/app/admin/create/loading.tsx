import { Skeleton } from "@/components/ui/skeleton";

/**
 * /admin/create — état de chargement (skeleton) : placeholder affiché
 * pendant que la page serveur (session + garde) se résout. Même structure
 * que le formulaire : en-tête titre + actions, carte formulaire à gauche,
 * cartes aperçu et étapes à droite.
 */
export default function CreationAdminChargement() {
  return (
    <div
      role="status"
      aria-label="Chargement du formulaire de création"
      className="flex flex-1 flex-col gap-4 p-4 pt-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-3.5 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-28" />
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-px flex-1" />
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-full" />
            </div>
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-px flex-1" />
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-[76px] w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <Skeleton className="h-4 w-32" />
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
