import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type ReadoutStat = {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  secondary?: boolean;
};

export function Readout({ stats }: { stats: ReadoutStat[] }) {
  if (stats.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 divide-x divide-y divide-dashed divide-border overflow-hidden rounded-lg border bg-card sm:grid-cols-4 sm:divide-y-0">
      {stats.map((stat) => (
        <div key={stat.label} className="px-4 py-3">
          <dt className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            {stat.accent ? (
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full bg-amber-600"
              />
            ) : null}
            {stat.label}
          </dt>
          <dd
            className={cn(
              "mt-1 text-2xl font-semibold tracking-tight tabular-nums",
              stat.accent
                ? "text-amber-700 dark:text-amber-400"
                : stat.secondary
                  ? "text-muted-foreground"
                  : "text-foreground",
            )}
          >
            {stat.value}
          </dd>
          {stat.hint ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">
              {stat.hint}
            </p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

const ETAGES_LECTURE = [0, 1, 2, 3];

export function ReadoutChargement() {
  return (
    <dl className="grid grid-cols-2 divide-x divide-y divide-dashed divide-border overflow-hidden rounded-lg border bg-card sm:grid-cols-4 sm:divide-y-0">
      {ETAGES_LECTURE.map((etage) => (
        <div key={etage} className="px-4 py-3">
          <Skeleton className="h-3.5 w-20 max-w-full" />
          <Skeleton className="mt-2 h-7 w-16" />
        </div>
      ))}
    </dl>
  );
}
