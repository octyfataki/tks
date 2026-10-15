"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/** Bouton « Copier » pour un lien d'invitation. */
export function BoutonCopierLien({ lien }: { lien: string }) {
  const [copie, setCopie] = React.useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}${lien}`,
          );
          setCopie(true);
        } catch {
          setCopie(false);
        }
      }}
    >
      {copie ? "Copié ✓" : "Copier"}
    </Button>
  );
}
