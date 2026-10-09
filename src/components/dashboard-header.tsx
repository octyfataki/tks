"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  BellIcon,
  CircleHelpIcon,
  FileCheckIcon,
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
  /** Action métier principale, à droite (ex. lien vers une file à traiter). */
  action?: React.ReactNode
  /** Taux en vigueur. Absent tant que la tranche S3 ne le fournit pas. */
  taux?: TauxEnVigueur | null
  className?: string
}

function HeaderNotifications() {
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
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Dernières alertes à traiter.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-1 p-4 pt-0">
          <Button variant="ghost" disabled className="justify-start gap-2">
            <FileCheckIcon />
            Preuves de paiement en attente
          </Button>
          <Button variant="ghost" disabled className="justify-start gap-2">
            <AlertTriangleIcon />
            Conflits ouverts
          </Button>
          <div className="mt-auto pt-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => router.push("/admin/notifications")}
            >
              <BellIcon />
              Voir toutes les notifications
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

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
        <TauxDuJour taux={taux} />
        <HeaderNotifications />
        <HeaderIconButton label="Aide" onClick={() => router.push("/aide")}>
          <CircleHelpIcon />
        </HeaderIconButton>
        <ModeToggle />
        <PaletteRecherche className="w-32 justify-start gap-2 bg-muted/50 px-2 font-normal sm:w-48 lg:w-64" />
      </div>
    </div>
  )
}
