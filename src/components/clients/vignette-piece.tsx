"use client";

import { useState } from "react";
import { FileTextIcon } from "lucide-react";

/**
 * Vignette d'une pièce d'identité. Un fichier introuvable ou illisible ne
 * doit pas casser la fiche : l'image cède la place à l'icône du document,
 * aux mêmes dimensions, pour que le verdict reste lisible.
 */
export function VignettePiece({
  pieceId,
  mime,
  alt,
}: {
  pieceId: string;
  mime: string;
  alt: string;
}) {
  const [cassee, setCassee] = useState(false);
  const url = `/api/pieces-clients/${pieceId}`;

  if (!mime.startsWith("image/") || cassee) {
    return (
      <span
        aria-hidden
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded border bg-background text-muted-foreground"
      >
        <FileTextIcon className="size-7" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- aperçu local authentifié, pas d'optimisation CDN
    <img
      src={url}
      alt={alt}
      onError={() => setCassee(true)}
      className="h-20 w-20 shrink-0 rounded border object-cover ring-offset-2 ring-offset-background transition group-hover:ring-2 group-hover:ring-primary/40"
    />
  );
}