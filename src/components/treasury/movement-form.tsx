"use client";

import * as React from "react";
import { useTransition } from "react";
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { readAmount } from "@/modules/pricing/price-record";
import {
  enregistrerMouvementAction,
  type ResultatMouvement,
} from "./cash-actions";
import { heureIso, jourIso, montantLabel } from "./format";
import {
  CATEGORIES,
  CATEGORY_DIRECTIONS,
  CATEGORY_LABELS,
  DIRECTION_LABELS,
  estCategorie,
} from "@/modules/treasury/cash-record";
import type { CompteAffiche } from "./types";

const CATEGORIES_MANUELLES = CATEGORIES.filter((categorie) => categorie !== "TRANSFER");

export function MovementForm({
  comptes,
  compteParDefaut,
  triggerVariant = "default",
  triggerClassName,
}: {
  comptes: CompteAffiche[];
  compteParDefaut?: string;
  triggerVariant?: "default" | "secondary" | "outline";
  triggerClassName?: string;
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const isMobile = useIsMobile();
  const [compteId, setCompteId] = React.useState(compteParDefaut ?? comptes[0]?.id ?? "");
  const [categorie, setCategorie] = React.useState<string>("SALE");
  const [montant, setMontant] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [jour, setJour] = React.useState(() => jourIso(new Date()));
  const [heure, setHeure] = React.useState(() => heureIso(new Date()));
  const [enCours, debuter] = useTransition();

  const compte = comptes.find((candidat) => candidat.id === compteId);
  const categorieChoisie =
    estCategorie(categorie) && categorie !== "TRANSFER" ? categorie : "SALE";
  const sens = CATEGORY_DIRECTIONS[categorieChoisie][0];
  const montantLue = readAmount(montant);
  const montantValide = Number.isInteger(montantLue) && montantLue > 0;
  const horodatageValide = /^\d{4}-\d{2}-\d{2}$/.test(jour) && /^\d{2}:\d{2}$/.test(heure);

  function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!compte || !montantValide || !horodatageValide) return;
    debuter(async () => {
      let issue: ResultatMouvement = { ok: false, erreur: "Mouvement impossible." };
      try {
        issue = await enregistrerMouvementAction({
          accountId: compte.id,
          direction: sens,
          category: categorieChoisie,
          amount: montantLue,
          currency: compte.currency,
          description: description.trim() === "" ? null : description.trim(),
          occurredAt: new Date(`${jour}T${heure}:00`),
          deviceId: null,
        });
      } finally {
        if (issue.ok) {
          toast.add({
            type: "success",
            title: sens === "IN" ? "Entrée enregistrée" : "Sortie enregistrée",
            description: `${montantLabel(montantLue, compte.currency)} — ${compte.label}.`,
          });
          setMontant("");
          setDescription("");
          setHeure(heureIso(new Date()));
          setOuvert(false);
        } else {
          toast.add({ type: "error", title: "Mouvement impossible", description: issue.erreur });
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
      <DrawerTrigger render={<Button variant={triggerVariant} className={triggerClassName} />}>
        Nouveau mouvement
      </DrawerTrigger>
      <DrawerContent showCloseButton={false}>
        <form onSubmit={soumettre} className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="border-b p-4">
            <DrawerTitle>Nouveau mouvement</DrawerTitle>
            <DrawerDescription>
              Chaque argent porte son motif : une catégorie, un sens, un compte.
              Un transfert passe par l&apos;opération de transfert, jamais par ici.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="movement-account">Compte</FieldLabel>
                <Select value={compteId} onValueChange={(valeur) => setCompteId(String(valeur))}>
                  <SelectTrigger id="movement-account">
                    <SelectValue placeholder="Choisir un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {comptes.map((candidat) => (
                      <SelectItem key={candidat.id} value={candidat.id}>
                        {candidat.label} ({candidat.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {compte ? (
                  <FieldDescription>
                    Tenu en {compte.currency} : le mouvement suivra cette devise.
                  </FieldDescription>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="movement-category">Catégorie</FieldLabel>
                <Select value={categorie} onValueChange={(valeur) => setCategorie(String(valeur))}>
                  <SelectTrigger id="movement-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES_MANUELLES.map((candidat) => (
                      <SelectItem key={candidat} value={candidat}>
                        {CATEGORY_LABELS[candidat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs"
              >
                {sens === "IN" ? (
                  <ArrowDownLeftIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowUpRightIcon className="size-3.5 text-rose-600 dark:text-rose-400" />
                )}
                <span>
                  {CATEGORY_LABELS[categorieChoisie]} : {DIRECTION_LABELS[sens].toLowerCase()} de{" "}
                  {compte?.label ?? "compte"}
                </span>
              </div>

              <Field>
                <FieldLabel htmlFor="movement-amount">Montant</FieldLabel>
                <Input
                  id="movement-amount"
                  value={montant}
                  onChange={(evenement) => setMontant(evenement.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  placeholder="5000"
                  className="h-14 px-3 text-3xl font-semibold tracking-tight tabular-nums"
                />
                <FieldDescription>
                  Entier strictement positif, en {compte?.currency ?? "la devise du compte"}.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="movement-description">Description</FieldLabel>
                <Textarea
                  id="movement-description"
                  value={description}
                  onChange={(evenement) => setDescription(evenement.target.value)}
                  rows={2}
                  maxLength={400}
                  placeholder="Ce qui s'est passé, en une phrase."
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="movement-day">Date</FieldLabel>
                  <Input
                    id="movement-day"
                    type="date"
                    value={jour}
                    onChange={(evenement) => setJour(evenement.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="movement-time">Heure</FieldLabel>
                  <Input
                    id="movement-time"
                    type="time"
                    value={heure}
                    onChange={(evenement) => setHeure(evenement.target.value)}
                    required
                  />
                </Field>
              </div>
            </FieldGroup>
          </div>

          <DrawerFooter className="border-t">
            <Button
              type="submit"
              className="h-[34px]"
              disabled={enCours || !montantValide || !horodatageValide || !compte}
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
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
