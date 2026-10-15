import { Skeleton } from "@/components/ui/skeleton";

export default function ParametresChargement() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="flex flex-col gap-4">
        {["Sécurité", "Synchro", "Appareil", "Notifications"].map((section) => (
          <section key={section} aria-label={`Chargement ${section}`} className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48 max-w-full" />
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-full max-w-md" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
