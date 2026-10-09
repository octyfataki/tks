"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  BellIcon,
  CircleHelpIcon,
  ClipboardListIcon,
  FileCheckIcon,
  UserCheckIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { PaletteRecherche } from "@/components/palette-recherche"
import { ModeToggle } from "@/components/mode-toggle"
import { DateDuJour, TauxDuJour, type TauxEnVigueur } from "@/components/taux-du-jour"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type DashboardHeaderProps = {
  /** Fil d'Ariane de la page visitée, à gauche. Chaque page fournit ses segments. */
  filAriane?: React.ReactNode
  /** Action métier principale, à droite (ex. lien « Comptes à valider »). */
  action?: React.ReactNode
  /** Taux en vigueur. Absent tant que la tranche S3 ne le fournit pas. */
  taux?: TauxEnVigueur | null
  /** Sans la permission `taux.saisir`, le modal s'ouvre en lecture seule. */
  peutSaisirTaux?: boolean
  /** Cible du bouton d'aide — l'aide de l'espace courant. */
  aideHref?: string
  /** Panneau de notifications. Défaut : celui de l'espace administrateur. */
  notifications?: React.ReactNode
  /** Recherche. Défaut : palette au périmètre administrateur. */
  recherche?: React.ReactNode
  className?: string
}

export type ElementNotification = {
  /** Libellé affiché, vocabulaire du domaine (GLOSSARY.md). */
  etiquette: string
  icone: LucideIcon
  /** Destination. Absente = écran pas encore construit, bouton désactivé. */
  href?: string
  /** Raccourci explicite pour désactiver sans retirer l'écran. */
  desactive?: boolean
}

/**
 * Tiroir de notifications, piloté par son contenu : chaque espace
 * (administrateur, agent de service) fournit ses écrans, le tiroir ne
 * connaît que des étiquettes et des destinations.
 */
export function PanneauNotifications({
  elements,
  voirTout,
  titre = "Notifications",
  description = "Dernières alertes à traiter.",
}: {
  elements: ElementNotification[]
  voirTout?: { etiquette: string; href: string }
  titre?: string
  description?: string
}) {
  const router = useRouter()

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Notifications"
            className="relative"
          >
            <BellIcon />
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive ring-2 ring-background"
            />
          </Button>
        }
      />
      <SheetContent side="right" className="w-80 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{titre}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-1 p-4 pt-0">
          {elements.map((element) => {
            const Icone = element.icone
            const inactif = element.desactive || element.href === undefined
            return (
              <Button
                key={element.etiquette}
                variant="ghost"
                disabled={inactif}
                className="justify-start gap-2"
                onClick={
                  element.href && !inactif
                    ? () => router.push(element.href as string)
                    : undefined
                }
              >
                <Icone />
                {element.etiquette}
              </Button>
            )
          })}
          {voirTout ? (
            <div className="mt-auto pt-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => router.push(voirTout.href)}
              >
                <BellIcon />
                {voirTout.etiquette}
              </Button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

const ELEMENTS_NOTIFICATIONS_ADMIN: ElementNotification[] = [
  {
    etiquette: "Preuves de paiement en attente",
    icone: FileCheckIcon,
    desactive: true,
  },
  { etiquette: "Conflits ouverts", icone: AlertTriangleIcon, desactive: true },
  {
    etiquette: "Comptes clients à valider",
    icone: UsersIcon,
    href: "/admin/clients/validation",
  },
]

function NotificationsAdmin() {
  return (
    <PanneauNotifications
      elements={ELEMENTS_NOTIFICATIONS_ADMIN}
      voirTout={{
        etiquette: "Voir toutes les notifications",
        href: "/admin/notifications",
      }}
    />
  )
}

/**
 * Raccourcis de la journée au comptoir : servir, encaisser, valider.
 * Chaque entrée mène à une page agent qui existe — pas de lien
 * « voir tout », l'espace agent n'a pas de page de notifications.
 */
export const ELEMENTS_NOTIFICATIONS_AGENT: ElementNotification[] = [
  {
    etiquette: "Comptes à valider",
    icone: UserCheckIcon,
    href: "/agent/clients/validation",
  },
  {
    etiquette: "Preuves de paiement en attente",
    icone: FileCheckIcon,
    href: "/agent/preuves",
  },
  {
    etiquette: "Commandes à servir",
    icone: ClipboardListIcon,
    href: "/agent/commandes",
  },
]

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="icon" aria-label={label} onClick={onClick}>
            {children}
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

export function DashboardHeader({
  filAriane,
  action,
  taux = null,
  peutSaisirTaux = true,
  aideHref = "/aide",
  notifications,
  recherche,
  className,
}: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <div
      data-slot="dashboard-header"
      className={cn("flex w-full items-center gap-2", className)}
    >
      {/* Fil d'Ariane de la page visitée, à gauche. */}
      {filAriane ? (
        <div className="hidden min-w-0 flex-1 md:block">{filAriane}</div>
      ) : null}

      {/* Actions à droite, recherche à l'extrême droite. */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {action}
        <DateDuJour />
        <TauxDuJour taux={taux} peutSaisir={peutSaisirTaux} />
        {notifications ?? <NotificationsAdmin />}
        <HeaderIconButton label="Aide" onClick={() => router.push(aideHref)}>
          <CircleHelpIcon />
        </HeaderIconButton>
        <ModeToggle />
        {recherche ?? (
          <PaletteRecherche className="w-32 justify-start gap-2 bg-muted/50 px-2 font-normal sm:w-48 lg:w-64" />
        )}
      </div>
    </div>
  )
}
