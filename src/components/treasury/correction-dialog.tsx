"use client";

import * as React from "react";
import { useTransition } from "react";
import { CircleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { corrigerAction, type ResultatCorrection } from "./cash-actions";
import { montantLabel } from "./format";
import {
  CATEGORY_LABELS,
  DIRECTION_LABELS,
  type CashCategory,
  type MovementDirection,
} from "@/modules/treasury/cash-record";
import type { LigneCorrigible } from "./movement-table";

export function CorrectionDialog({ ligne }: { ligne: LigneCorrigible }) {
  const [ouvert, setOuvert] = React.useState(false);
  const isMobile = useIsMobile();
  const [motif, setMotif] = React.useState("");
  const [enCours, debuter] = useTransition();

  const motifValide = motif.trim() !== "";

  function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!motifValide) return;
    debuter(async () => {
      let issue: ResultatCorrection = { ok: false, erreur: "Correction impossible." };
      try {
        issue = await corrigerAction(ligne.id, motif.trim());
      } finally {
        if (issue.ok) {
          toast.add({
            type: "success",
            title: "Correction posée",
            description: `L'écriture d'origine reste visible ; une écriture inverse annule l'effet.`,
          });
          setMotif("");
          setOuvert(false);
        } else {
          toast.add({ type: "error", title: "Correction impossible", description: issue.erreur });
        }
      }
    });
  }

  return (
    <Drawer
      open={ouvert}
      onOpenChange={setOuvert}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerTrigger
        render={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" />}
      >
        Corriger
      </DrawerTrigger>
      <DrawerContent showCloseButton={false}>
        <form onSubmit={soumettre} className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="border-b p-4">
            <DrawerTitle>Corriger l&apos;écriture</DrawerTitle>
            <DrawerDescription>
              Rien n&apos;est supprimé : une écriture inverse est posée, celle
              d&apos;origine reste lisible.
              {ligne.transfertLie ? " Les deux jambes du transfert sont corrigées ensemble." : null}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border bg-card p-3 text-xs">
                <p className="font-medium">
                  {ligne.compteLabel} — {montantLabel(ligne.amount, ligne.currency)}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {CATEGORY_LABELS[ligne.category as CashCategory] ?? ligne.category} ·{" "}
                  {DIRECTION_LABELS[ligne.direction as MovementDirection] ?? ligne.direction}
                </p>
                {ligne.description ? (
                  <p className="mt-1 text-muted-foreground">{ligne.description}</p>
                ) : null}
              </div>

              <Field>
                <FieldLabel htmlFor="correction-motif">Motif</FieldLabel>
                <Textarea
                  id="correction-motif"
                  value={motif}
                  onChange={(evenement) => setMotif(evenement.target.value)}
                  rows={2}
                  maxLength={400}
                  required
                  placeholder="Pourquoi cette écriture est fausse."
                />
              </Field>

              <p className="flex gap-2 rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Une correction sans motif est une suppression maquillée : le
                  motif est exigé et tracé au journal d&apos;audit.
                </span>
              </p>
            </div>
          </div>

          <DrawerFooter className="border-t">
            <Button type="submit" className="h-[34px]" disabled={enCours || !motifValide}>
              {enCours ? "Correction…" : "Poser la correction"}
            </Button>
            <DrawerClose render={<Button variant="outline" className="h-[34px]" />}>
              Annuler
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
