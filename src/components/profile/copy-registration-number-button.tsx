"use client";

import * as React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Petit bouton copie du matricule, avec retour « Copié ». */
export function BoutonCopierMatricule({
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
      aria-label={copie ? "Matricule copié" : "Copier le matricule"}
      title={copie ? "Copié" : "Copier le matricule"}
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
        "inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {copie ? <CheckIcon className="size-3.5" aria-hidden /> : <CopyIcon className="size-3.5" aria-hidden />}
    </button>
  );
}
