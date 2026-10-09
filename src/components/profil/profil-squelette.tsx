import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Mon compte — état de chargement : même structure que la page
 * (bandeau d'identité, colonne large + colonne empilée).
 */
export function ProfilSquelette({ className }: { className?: string }) {
  return (
    <section
      role="status"
      aria-label="Chargement du compte"
      className={cn("w-full", className)}
    >
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Skeleton className="size-16 shrink-0 rounded-full sm:size-20" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-44 max-w-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-4 w-56 max-w-full" />
              <Skeleton className="mt-2 h-3 w-40 max-w-full" />
            </div>
          </div>
          <Separator orientation="vertical" className="hidden sm:block" />
          <Separator className="sm:hidden" />
          <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-3 min-[420px]:grid-cols-2 sm:max-w-sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-0">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-1.5 h-4 w-32 max-w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {[0, 1].map((carte) => (
            <div key={carte} className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="size-7 rounded-md" />
              </div>
              <Separator className="mt-2" />
              <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-0">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="mt-1.5 h-4 w-36 max-w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((carte) => (
            <div key={carte} className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="size-7 rounded-md" />
              </div>
              <Separator className="mt-2" />
              <div className="mt-4 flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
