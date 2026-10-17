"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  BellIcon,
  CircleHelpIcon,
  ClipboardListIcon,
  FileCheckIcon,
  ScaleIcon,
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
import { PaletteRecherche } from "@/components/search-palette"
import { ModeToggle } from "@/components/mode-toggle"
import { DateDuJour } from "@/components/daily-rate"
import { TauxDuJourAuto } from "@/components/auto-daily-rate"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type DashboardHeaderProps = {
  filAriane?: React.ReactNode
  action?: React.ReactNode
  aideHref?: string
  notifications?: React.ReactNode
  recherche?: React.ReactNode
  className?: string
}

export type ElementNotification = {
  etiquette: string
  icone: LucideIcon
  href?: string
  desactive?: boolean
}

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

export const ELEMENTS_NOTIFICATIONS_AGENT: ElementNotification[] = [
  {
    etiquette: "Comptes à valider",
    icone: UserCheckIcon,
    href: "/agent/clients/validation",
  },
  {
    etiquette: "Preuves de paiement en attente",
    icone: FileCheckIcon,
    href: "/agent/proofs",
  },
  {
    etiquette: "Commandes à servir",
    icone: ClipboardListIcon,
    href: "/agent/orders",
  },
]

export const ELEMENTS_NOTIFICATIONS_CLIENT: ElementNotification[] = [
  {
    etiquette: "Votre compte et solde",
    icone: ScaleIcon,
    href: "/clients",
  },
  {
    etiquette: "Suivi des commandes",
    icone: ClipboardListIcon,
    desactive: true,
  },
  {
    etiquette: "Preuves de paiement en attente",
    icone: FileCheckIcon,
    desactive: true,
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
  aideHref = "/help",
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
      {filAriane ? (
        <div className="hidden min-w-0 flex-1 md:block">{filAriane}</div>
      ) : null}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {action}
        <DateDuJour />
        <TauxDuJourAuto />
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
