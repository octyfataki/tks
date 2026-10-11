"use client";

import { useActionState, useEffect, useRef } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import {
  ETIQUETTES_FERMEES,
  type Etiquette,
} from "@/lib/s4-annotations/etiquettes";
import { CLASSES_TEINTE } from "./etiquettes-badge";
import {
  poserEtiquetteAction,
  retirerEtiquetteAction,
  type ResultatAnnotation,
} from "./actions";

const ETAT_INITIAL: ResultatAnnotation | null = null;

/**
 * Un bouton-bascule par étiquette de la liste fermée. Inactive → « poser »,
 * active → « retirer » (écriture inverse, jamais de suppression). Tout le
 * feedback (succès comme refus) passe par les toasts : pas de message
 * inline — le bouton reste compact dans la fiche.
 */
function BoutonEtiquette({
  compteId,
  code,
  libelle,
  teinte,
  active,
}: {
  compteId: string;
  code: Etiquette;
  libelle: string;
  teinte: keyof typeof CLASSES_TEINTE;
  active: boolean;
}) {
  const [resultat, formAction, enCours] = useActionState(
    active ? retirerEtiquetteAction : poserEtiquetteAction,
    ETAT_INITIAL,
  );
  const dernierResultat = useRef<ResultatAnnotation | null>(null);

  useEffect(() => {
    if (!resultat || dernierResultat.current === resultat) return;
    dernierResultat.current = resultat;
    if (resultat.ok) {
      toast.add({
        type: "success",
        title: active
          ? `Étiquette « ${libelle} » retirée`
          : `Étiquette « ${libelle} » posée`,
      });
    } else {
      toast.add({
        type: "error",
        title: active ? "Étiquette non retirée" : "Étiquette non posée",
        description: resultat.erreur,
      });
    }
  }, [resultat, active, libelle]);

  return (
    <form action={formAction} className="inline-flex flex-col gap-1">
      <input type="hidden" name="compteId" value={compteId} />
      <input type="hidden" name="etiquette" value={code} />
      <button
        type="submit"
        aria-pressed={active}
        disabled={enCours}
        title={active ? `Retirer « ${libelle} »` : `Poser « ${libelle} »`}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          active
            ? CLASSES_TEINTE[teinte]
            : "border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/70 hover:text-foreground",
          enCours && "cursor-wait opacity-70",
        )}
      >
        {active ? <XIcon className="size-3" /> : <PlusIcon className="size-3" />}
        {libelle}
        <span className="sr-only">
          {active ? "— actif, cliquer pour retirer" : "— inactif, cliquer pour poser"}
        </span>
      </button>
    </form>
  );
}

/**
 * Zone d'annotation d'un compte client : toutes les étiquettes de la liste
 * fermée, avec leur état. Sans la permission `client.annoter`, la zone
 * explique le refus au lieu d'afficher des boutons sans effet.
 */
export function FormulairesEtiquettes({
  compteId,
  actives,
  peutAnnoter,
}: {
  compteId: string;
  actives: readonly string[];
  peutAnnoter: boolean;
}) {
  if (!peutAnnoter) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Annotation réservée aux comptes autorisés (« client.annoter »).
      </p>
    );
  }
  const actifSet = new Set(actives);
  return (
    <div className="flex flex-wrap items-start gap-1.5">
      {ETIQUETTES_FERMEES.map((etiquette) => (
        <BoutonEtiquette
          key={etiquette.code}
          compteId={compteId}
          code={etiquette.code}
          libelle={etiquette.libelle}
          teinte={etiquette.teinte}
          active={actifSet.has(etiquette.code)}
        />
      ))}
    </div>
  );
}
