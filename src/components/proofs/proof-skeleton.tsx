import { Skeleton } from "@/components/ui/skeleton";

export function CartePreuveChargement() {
  return (
    <li>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="p-2">
          <Skeleton className="h-44 w-full rounded-md" />
        </div>
        <div className="border-t px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-1.5 h-3 w-24" />
        </div>
        <div className="flex items-baseline justify-between gap-2 px-3 pb-2.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="px-3 pb-3">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>
    </li>
  );
}

const CARTES_VIERGES = [0, 1, 2, 3, 4, 5];

export function FilePreuvesChargement() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3.5 w-6" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARTES_VIERGES.map((carte) => (
          <CartePreuveChargement key={carte} />
        ))}
      </ul>
    </section>
  );
}

function DecisionVierge() {
  return (
    <tr>
      <td className="px-3 py-2.5">
        <Skeleton className="h-3.5 w-32" />
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
        <Skeleton className="h-3.5 w-20" />
      </td>
    </tr>
  );
}

const DECISIONS_VIERGES = [0, 1, 2, 3];

export function DecisionsChargement() {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3.5 w-6" />
      </div>
      <div className="tks-defilement-masque min-w-0 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <tbody className="divide-y">
            {DECISIONS_VIERGES.map((ligne) => (
              <DecisionVierge key={ligne} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
