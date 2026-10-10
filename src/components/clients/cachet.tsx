import { cn } from "@/lib/utils";

/**
 * Cachet tamponné portant un statut. L'élément mémorable du registre : une
 * encre par état (ambre = en attente, vert = fait, neutre = expiré, rouge =
 * révoqué), légèrement de travers comme un vrai tampon administratif.
 */
export function Cachet({
  encre,
  children,
}: {
  encre: "attente" | "fait" | "expire" | "revoque";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block -rotate-1 rounded border-2 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        encre === "attente" &&
          "border-amber-600/60 text-amber-700 dark:text-amber-400",
        encre === "fait" &&
          "border-green-700/50 text-green-700 dark:text-green-400",
        encre === "expire" &&
          "border-muted-foreground/40 text-muted-foreground",
        encre === "revoque" && "border-destructive/60 text-destructive",
      )}
    >
      {children}
    </span>
  );
}
