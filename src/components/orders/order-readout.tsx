import { cn } from "@/lib/utils";

export type OrderStat = {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
};

export function OrderReadout({ stats }: { stats: OrderStat[] }) {
  if (stats.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
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
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.hint}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
