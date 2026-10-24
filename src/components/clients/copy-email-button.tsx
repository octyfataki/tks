"use client";

import * as React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function BoutonCopierEmail({
  valeur,
  className,
}: {
  valeur: string;
  className?: string;
}) {
  const [copie, setCopie] = React.useState(false);
  return (
    <button
      type="button"
      aria-label={copie ? "Email copié" : "Copier l'email"}
      title={copie ? "Copié" : "Copier l'email"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(valeur);
          setCopie(true);
          window.setTimeout(() => setCopie(false), 2000);
        } catch {
          setCopie(false);
        }
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {copie ? <CheckIcon className="size-3.5" aria-hidden /> : <CopyIcon className="size-3.5" aria-hidden />}
    </button>
  );
}
