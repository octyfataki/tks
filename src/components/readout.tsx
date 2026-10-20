import { cn } from "@/lib/utils";

export type ReadoutStat = {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
};

export function Readout({ stats }: { stats: ReadoutStat[] }) {
  if (stats.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 divide-x divide-y divide-dashed divide-border overflow-hidden rounded-lg border bg-card sm:grid-cols-4 sm:divide-y-0">
      {stats.map((stat) => (
        <div key={stat.label} className="px-4 py-3">
          <dt className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            {stat.label}
          </dt>
          <dd
            className={cn(
              "mt-1 text-2xl font-semibold tracking-tight tabular-nums",
              stat.accent
                ? "text-amber-700 dark:text-amber-400"
                : "text-foreground",
            )}
          >
            {stat.value}
          </dd>
          {stat.hint ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.hint}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
