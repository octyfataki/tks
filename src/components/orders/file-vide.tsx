import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ContenuVide = {
  icone: LucideIcon;
  titre: string;
  detail: string;
  action?: ReactNode;
};

export function FileVideMessage({ icone: Icone, titre, detail, action }: ContenuVide) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span
        aria-hidden
        className="flex size-10 items-center justify-center rounded-full border border-dashed bg-muted/30 text-muted-foreground"
      >
        <Icone className="size-4" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{titre}</p>
        <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
