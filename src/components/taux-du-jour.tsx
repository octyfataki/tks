"use client"

import * as React from "react"
import { CalendarIcon, PercentIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type TauxEnVigueur = {
  /** Francs pour 1 USD. */
  valeur: number
  /** Date ISO (AAAA-MM-JJ) du taux en vigueur. */
  dateSaisie: string
  /** Qui a saisi le taux, si connu. */
  saisiPar?: string
}

function formaterDateDuJour(date: Date): string {
  const texte = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(date)
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

function formaterMontant(valeur: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    valeur
  )
}

const classePastille =
  "h-7 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium whitespace-nowrap"

/** Pastille non interactive : la date du jour, calculée côté client. */
export function DateDuJour({ className }: { className?: string }) {
  const aujourdHui = new Date()
  return (
    <span
      data-slot="date-du-jour"
      className={cn("hidden lg:inline-flex", classePastille, className)}
    >
      <CalendarIcon aria-hidden className="size-3.5 text-muted-foreground" />
      <time dateTime={aujourdHui.toISOString().slice(0, 10)}>
        {formaterDateDuJour(aujourdHui)}
      </time>
    </span>
  )
}

/**
 * Pastille du taux en vigueur + modal de saisie du taux du jour.
 *
 * La persistance (tranche S3 : entité datée, permission `taux.saisir`,
 * écriture journalisée, un jour = au plus un taux) n'existe pas encore :
 * sans `onEnregistrer`, le formulaire est inerte et l'indisponibilité est
 * annoncée au lieu d'être simulée.
 */
export function TauxDuJour({
  taux = null,
  peutSaisir = true,
  onEnregistrer,
  className,
}: {
  taux?: TauxEnVigueur | null
  /** Sans la permission `taux.saisir`, la pastille reste informative. */
  peutSaisir?: boolean
  /** Appelé avec la valeur validée. Absent = saisie pas encore câblée. */
  onEnregistrer?: (valeur: number) => void | Promise<void>
  className?: string
}) {
  const [ouvert, setOuvert] = React.useState(false)
  const [valeur, setValeur] = React.useState("")
  const [erreur, setErreur] = React.useState<string | null>(null)

  const libelle =
    taux === null
      ? "Taux du jour : —"
      : `1 USD = ${formaterMontant(taux.valeur)} CDF`

  const contenu = (
    <>
      <PercentIcon aria-hidden className="size-3.5 text-muted-foreground" />
      {libelle}
    </>
  )

  if (!peutSaisir) {
    return (
      <span
        data-slot="taux-du-jour"
        className={cn("hidden lg:inline-flex", classePastille, className)}
      >
        {contenu}
      </span>
    )
  }

  const pret = onEnregistrer !== undefined

  const soumettre = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onEnregistrer) return
    const nombre = Number(valeur.replace(",", "."))
    if (!Number.isFinite(nombre) || nombre <= 0) {
      setErreur("Saisir un montant strictement positif, en CDF pour 1 USD.")
      return
    }
    setErreur(null)
    await onEnregistrer(nombre)
    setOuvert(false)
    setValeur("")
  }

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            aria-label="Saisir le taux du jour"
            className={cn("hidden lg:inline-flex", classePastille, className)}
          >
            {contenu}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Taux du jour</DialogTitle>
          <DialogDescription>
            1 USD = X CDF, saisi manuellement une fois par jour. Un jour porte
            au plus un taux : une seconde saisie ne remplace jamais la
            première.
          </DialogDescription>
        </DialogHeader>
        {taux === null ? (
          <p className="text-xs/relaxed text-muted-foreground">
            Aucun taux saisi aujourd&apos;hui. Sans taux, aucun montant en USD
            ne peut être converti.
          </p>
        ) : (
          <p className="text-xs/relaxed text-muted-foreground">
            En vigueur : 1 USD = {formaterMontant(taux.valeur)} CDF (saisi le{" "}
            {taux.dateSaisie}
            {taux.saisiPar ? ` par ${taux.saisiPar}` : ""}).
          </p>
        )}
        <form id="formulaire-taux-du-jour" onSubmit={soumettre}>
          <Field>
            <FieldLabel htmlFor="taux-valeur">
              Valeur — francs pour 1 dollar (CDF)
            </FieldLabel>
            <Input
              id="taux-valeur"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="ex. 2300"
              value={valeur}
              onChange={(event) => setValeur(event.target.value)}
              disabled={!pret}
            />
            <FieldDescription>
              Saisie manuelle, jamais récupérée automatiquement : c&apos;est un
              taux négocié.
            </FieldDescription>
            {erreur ? <FieldError>{erreur}</FieldError> : null}
          </Field>
        </form>
        {!pret ? (
          <p className="text-xs/relaxed text-muted-foreground">
            Bientôt — la persistance arrive avec la tranche S3 (permission
            « taux.saisir », saisie journalisée comme écriture métier).
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline">Annuler</Button>}
          />
          <Button
            type="submit"
            form="formulaire-taux-du-jour"
            disabled={!pret}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
