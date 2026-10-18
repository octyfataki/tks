import type { ReactNode } from "react";

export function AgentComingSoon({
  icon,
  title,
  text,
  upcoming,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  upcoming: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
        <span
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          {icon}
        </span>
        <h1 className="mt-4 text-base font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {text}
        </p>
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {upcoming}
        </p>
      </div>
    </div>
  );
}
