import { Skeleton } from "@/components/ui/skeleton";

export function BandeauChargement() {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-card px-3 py-2 text-xs">
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
      />
      <Skeleton className="h-3.5 w-64 max-w-full" />
    </div>
  );
}

export function BarreFiltresChargement({ boutons }: { boutons: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 min-w-0 flex-1 basis-52 sm:max-w-xs" />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {Array.from({ length: boutons }, (_, index) => (
            <Skeleton key={index} className="h-9 w-24" />
          ))}
        </div>
      </div>
      <Skeleton className="mt-2.5 h-3 w-32" />
    </div>
  );
}

function LigneVierge() {
  return (
    <tr>
      <td className="px-3 py-2.5">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="mt-1 h-3 w-20" />
      </td>
      <td className="px-3 py-2.5">
        <span className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </span>
      </td>
      <td className="px-3 py-2.5 text-right">
        <Skeleton className="ml-auto h-3.5 w-10" />
      </td>
      <td className="px-3 py-2.5 text-right">
        <Skeleton className="ml-auto h-3.5 w-16" />
      </td>
      <td className="px-3 py-2.5">
        <Skeleton className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-3 py-2.5">
        <Skeleton className="h-3.5 w-16" />
      </td>
      <td className="px-3 py-2.5 text-right">
        <Skeleton className="ml-auto h-8 w-16 rounded-lg" />
      </td>
    </tr>
  );
}

const LIGNES_VIERGES = [0, 1, 2, 3, 4, 5, 6, 7];

export function OngletsChargement() {
  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex h-auto w-fit max-w-full flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="tks-defilement-masque min-w-0 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[860px] border-collapse text-left text-xs">
          <tbody className="divide-y">
            {LIGNES_VIERGES.map((ligne) => (
              <LigneVierge key={ligne} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Skeleton className="h-3.5 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
