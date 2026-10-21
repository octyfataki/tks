"use client";

import * as React from "react";
import { useTransition } from "react";
import { ArrowRightIcon } from "lucide-react";
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
import { CURRENCIES, readAmount } from "@/modules/pricing/price-record";
import { transfererAction, type ResultatTransfert } from "./cash-actions";
import { heureIso, jourIso, montantLabel } from "./format";
import type { CompteAffiche } from "./types";

export function TransferForm({
  comptes,
  triggerVariant = "secondary",
}: {
  comptes: CompteAffiche[];
  triggerVariant?: "default" | "secondary" | "outline";
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const isMobile = useIsMobile();
  const [devise, setDevise] = React.useState<string>("USD");
  const [departId, setDepartId] = React.useState("");
  const [arriveeId, setArriveeId] = React.useState("");
  const [montant, setMontant] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [jour, setJour] = React.useState(() => jourIso(new Date()));
  const [heure, setHeure] = React.useState(() => heureIso(new Date()));
  const [enCours, debuter] = useTransition();

  const deviseChoisie = CURRENCIES.find((candidat) => candidat === devise) ?? "USD";
  const eligeables = comptes.filter((compte) => compte.currency === deviseChoisie);
  const depart = eligeables.find((compte) => compte.id === departId);
  const arrivee = eligeables.find((compte) => compte.id === arriveeId);
  const montantLue = readAmount(montant);
  const montantValide = Number.isInteger(montantLue) && montantLue > 0;
  const horodatageValide = /^\d{4}-\d{2}-\d{2}$/.test(jour) && /^\d{2}:\d{2}$/.test(heure);
  const memeCompte = depart !== undefined && depart.id === arrivee?.id;

  function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!depart || !arrivee || !montantValide || !horodatageValide || memeCompte) return;
    debuter(async () => {
      let issue: ResultatTransfert = { ok: false, erreur: "Transfert impossible." };
      try {
        issue = await transfererAction({
          fromAccountId: depart.id,
          toAccountId: arrivee.id,
          amount: montantLue,
          currency: deviseChoisie,
          description: description.trim() === "" ? null : description.trim(),
          occurredAt: new Date(`${jour}T${heure}:00`),
          deviceId: null,
        });
      } finally {
        if (issue.ok) {
          toast.add({
            type: "success",
            title: "Transfert enregistré",
            description: `${montantLabel(montantLue, deviseChoisie)} : ${depart.label} vers ${arrivee.label}.`,
          });
          setMontant("");
          setDescription("");
          setOuvert(false);
        } else {
          toast.add({ type: "error", title: "Transfert impossible", description: issue.erreur });
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
      <DrawerTrigger render={<Button variant={triggerVariant} />}>
        Transfert
      </DrawerTrigger>
      <DrawerContent showCloseButton={false}>
        <form onSubmit={soumettre} className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="border-b p-4">
            <DrawerTitle>Transfert entre comptes</DrawerTitle>
            <DrawerDescription>
              Une sortie et une entrée sont posées ensemble, sous un seul
              identifiant. Un transfert n&apos;est ni une recette ni une
              dépense : il ne change pas les totaux de flux.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="transfer-currency">Devise du transfert</FieldLabel>
                <Select
                  value={deviseChoisie}
                  onValueChange={(valeur) => {
                    setDevise(String(valeur));
                    setDepartId("");
                    setArriveeId("");
                  }}
                >
                  <SelectTrigger id="transfer-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((candidat) => (
                      <SelectItem key={candidat} value={candidat}>
                        {candidat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="transfer-from">Depuis</FieldLabel>
                <Select value={departId} onValueChange={(valeur) => setDepartId(String(valeur))}>
                  <SelectTrigger id="transfer-from">
                    <SelectValue placeholder="Compte de départ" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligeables.map((compte) => (
                      <SelectItem key={compte.id} value={compte.id}>
                        {compte.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="transfer-to">Vers</FieldLabel>
                <Select value={arriveeId} onValueChange={(valeur) => setArriveeId(String(valeur))}>
                  <SelectTrigger id="transfer-to">
                    <SelectValue placeholder="Compte d'arrivée" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligeables.map((compte) => (
                      <SelectItem key={compte.id} value={compte.id} disabled={compte.id === departId}>
                        {compte.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {depart && arrivee && !memeCompte ? (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs"
                >
                  <ArrowRightIcon className="size-3.5" />
                  <span className="tabular-nums">
                    {depart.label} → {arrivee.label}, en {deviseChoisie}
                  </span>
                </div>
              ) : null}

              {memeCompte ? (
                <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  Un transfert relie deux comptes différents.
                </p>
              ) : null}

              <Field>
                <FieldLabel htmlFor="transfer-amount">Montant</FieldLabel>
                <Input
                  id="transfer-amount"
                  value={montant}
                  onChange={(evenement) => setMontant(evenement.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  placeholder="20000"
                  className="h-14 px-3 text-3xl font-semibold tracking-tight tabular-nums"
                />
                <FieldDescription>
                  Entier strictement positif, en {deviseChoisie}.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="transfer-description">Description</FieldLabel>
                <Textarea
                  id="transfer-description"
                  value={description}
                  onChange={(evenement) => setDescription(evenement.target.value)}
                  rows={2}
                  maxLength={400}
                  placeholder="Pourquoi ce rééquilibrage."
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="transfer-day">Date</FieldLabel>
                  <Input
                    id="transfer-day"
                    type="date"
                    value={jour}
                    onChange={(evenement) => setJour(evenement.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="transfer-time">Heure</FieldLabel>
                  <Input
                    id="transfer-time"
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
              disabled={
                enCours ||
                !montantValide ||
                !horodatageValide ||
                !depart ||
                !arrivee ||
                memeCompte
              }
            >
              {enCours ? "Transfert…" : "Transférer"}
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
