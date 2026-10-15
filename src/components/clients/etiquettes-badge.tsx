import { cn } from "@/lib/utils";
import {
  etiquetteParCode,
  type TeinteEtiquette,
} from "@/lib/s4-annotations/etiquettes";

export const CLASSES_TEINTE: Record<TeinteEtiquette, string> = {
  rouge: "border-destructive/40 bg-destructive/10 text-destructive",
  vert: "border-green-700/40 bg-green-700/10 text-green-700 dark:text-green-400",
  bleu: "border-blue-600/40 bg-blue-600/10 text-blue-700 dark:text-blue-400",
};

export function PastilleEtiquette({ code }: { code: string }) {
  const etiquette = etiquetteParCode(code);
  if (!etiquette) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        CLASSES_TEINTE[etiquette.teinte],
      )}
    >
      {etiquette.libelle}
    </span>
  );
}

export function EtiquettesBadge({ codes }: { codes: readonly string[] }) {
  if (codes.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {codes.map((code) => (
        <PastilleEtiquette key={code} code={code} />
      ))}
    </span>
  );
}
