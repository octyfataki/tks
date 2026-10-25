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
  valeur: number
  depuisLe: string
  saisiPar?: string
}

export type TauxHistorique = {
  valeur: number
  jour: string
  saisiPar?: string
}

export type ResultatSaisieTaux = { ok: true } | { ok: false; erreur: string }

const ECART_AVERTISSEMENT_POURCENTAGE = 5

const NOMBRE = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })

const DATE_LONGUE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

const DATE_COURTE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
})

const ECART = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  signDisplay: "exceptZero",
  maximumFractionDigits: 1,
})

function formaterDateDuJour(date: Date): string {
  const texte = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(date)
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

function formaterJourLong(jour: string): string {
  return DATE_LONGUE.format(new Date(`${jour}T12:00:00Z`))
}

function formaterJourCourt(jour: string): string {
  return DATE_COURTE.format(new Date(`${jour}T12:00:00Z`))
}

function ecartTu(valeur: string, enVigueur: number): number | null {
  const nombre = Number(valeur.replace(",", "."))
  if (!Number.isInteger(nombre) || enVigueur <= 0) return null
  return ((nombre - enVigueur) / enVigueur) * 100
}

function ecartMarquant(ecart: number): boolean {
  return Math.abs(ecart) > ECART_AVERTISSEMENT_POURCENTAGE
}

const classePastille =
  "h-7 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium whitespace-nowrap"

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

export function TauxDuJour({
  taux = null,
  historique = [],
  peutSaisir = true,
  estClient = false,
  onEnregistrer,
  className,
}: {
  taux?: TauxEnVigueur | null
  historique?: TauxHistorique[]
  peutSaisir?: boolean
  estClient?: boolean
  onEnregistrer?: (
    valeur: number
  ) => ResultatSaisieTaux | Promise<ResultatSaisieTaux>
  className?: string
}) {
  const [ouvert, setOuvert] = React.useState(false)
  const [valeur, setValeur] = React.useState("")
  const [erreur, setErreur] = React.useState<string | null>(null)
  const [attenteConfirmation, setAttenteConfirmation] = React.useState(false)

  const libelle =
    taux === null ? "Taux en vigueur : —" : `1 USD = ${NOMBRE.format(taux.valeur)} CDF`

  const ecart = taux !== null ? ecartTu(valeur, taux.valeur) : null
  const avertit = ecart !== null && ecartMarquant(ecart)

  const contenu = (
    <>
      <PercentIcon aria-hidden className="size-3.5 text-muted-foreground" />
      {libelle}
    </>
  )

  const pret = peutSaisir && onEnregistrer !== undefined

  const soumettre = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onEnregistrer) return
    const nombre = Number(valeur.replace(",", "."))
    if (!Number.isFinite(nombre) || nombre <= 0) {
      setErreur("Saisir un montant strictement positif, en CDF pour 1 USD.")
      return
    }
    if (!Number.isInteger(nombre)) {
      setErreur("Saisir un nombre entier de francs, pour 1 USD.")
      return
    }
    if (taux !== null && avertit && !attenteConfirmation) {
      setAttenteConfirmation(true)
      return
    }
    setErreur(null)
    const resultat = await onEnregistrer(nombre)
    if (resultat && !resultat.ok) {
      setErreur(resultat.erreur)
      return
    }
    setOuvert(false)
    setValeur("")
    setAttenteConfirmation(false)
  }

  const saisieChange = (saisie: string) => {
    setValeur(saisie)
    setAttenteConfirmation(false)
    setErreur(null)
  }

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            aria-label={
              peutSaisir ? "Consulter ou saisir le taux" : "Consulter le taux"
            }
            className={cn("hidden lg:inline-flex", classePastille, className)}
          >
            {contenu}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Taux en vigueur</DialogTitle>
          <DialogDescription>
            Le dernier taux saisi fait foi, jusqu&apos;à ce qu&apos;un autre le
            remplace. Il survit d&apos;un jour à l&apos;autre.
          </DialogDescription>
        </DialogHeader>
        {taux === null ? (
          <p className="text-xs/relaxed text-muted-foreground">
            Aucun taux saisi pour le moment. Sans taux, aucun montant en USD ne
            peut être converti.
          </p>
        ) : (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-3xl font-semibold tabular-nums">
              {NOMBRE.format(taux.valeur)}
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                CDF pour 1 USD
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              En vigueur depuis le {formaterJourLong(taux.depuisLe)}
              {taux.saisiPar ? ` saisi par ${taux.saisiPar}` : ""}. Tous les
              montants en USD sont convertis à ce taux, au moment où vous les
              lisez.
            </p>
          </div>
        )}
        {peutSaisir ? (
          <>
            <form id="formulaire-taux-du-jour" onSubmit={soumettre}>
              <Field>
                <FieldLabel htmlFor="taux-valeur">
                  Nouveau taux (CDF pour 1 USD)
                </FieldLabel>
                <Input
                  id="taux-valeur"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder={taux ? String(taux.valeur) : "ex. 2300"}
                  value={valeur}
                  onChange={(event) => saisieChange(event.target.value)}
                  disabled={!pret}
                  className="tabular-nums"
                />
                <FieldDescription>
                  Saisie manuelle, jamais récupérée automatiquement : c&apos;est
                  un taux négocié.
                </FieldDescription>
                {ecart !== null && taux !== null ? (
                  avertit ? (
                    <FieldError>
                      {ECART.format(ecart / 100)} : les dettes en USD affichées
                      changent de valeur dès l&apos;enregistrement.
                    </FieldError>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {ECART.format(ecart / 100)} : le taux bouge, les dettes en
                      USD suivent immédiatement.
                    </p>
                  )
                ) : null}
                {erreur ? <FieldError>{erreur}</FieldError> : null}
              </Field>
            </form>
            {!pret ? (
              <p className="text-xs/relaxed text-muted-foreground">
                Saisie indisponible sur cet écran.
              </p>
            ) : null}
          </>
        ) : estClient ? null : (
          <p className="text-xs/relaxed text-muted-foreground">
            Lecture seule : seul un compte autorisé peut saisir le taux.
          </p>
        )}
        {historique.length > 0 ? (
          <ul className="border-t border-border pt-3 text-xs">
            {historique.map((ligne, rang) => (
              <li
                key={`${ligne.jour}-${rang}`}
                className="flex items-baseline justify-between gap-2 py-1"
              >
                <span className="tabular-nums font-medium">
                  {NOMBRE.format(ligne.valeur)}
                  <span className="ml-1 font-normal text-muted-foreground">
                    CDF
                  </span>
                </span>
                <span className="text-muted-foreground">
                  saisie du {formaterJourCourt(ligne.jour)}
                  {ligne.saisiPar ? ` par ${ligne.saisiPar}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline">
                {peutSaisir ? "Annuler" : "Fermer"}
              </Button>
            }
          />
          {peutSaisir ? (
            <Button
              type="submit"
              form="formulaire-taux-du-jour"
              disabled={!pret}
            >
              {attenteConfirmation ? "Confirmer le changement" : "Enregistrer"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
