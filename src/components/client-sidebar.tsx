"use client"

import * as React from "react"

import { NavMain, type NavItem } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { BrandLogo } from "@/components/brand-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BanknoteIcon,
  CircleHelpIcon,
  ClipboardListIcon,
  FileCheckIcon,
  FolderOpenIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  ScaleIcon,
  SettingsIcon,
} from "lucide-react"

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Pilotage",
    items: [
      {
        title: "Votre compte",
        url: "/clients",
        icon: <LayoutDashboardIcon />,
        isActive: true,
      },
    ],
  },
  {
    label: "Mon profil et crédit",
    items: [
      {
        title: "Mon profil",
        url: "#",
        icon: <FolderOpenIcon />,
        soon: true,
      },
      {
        title: "Statut et plafond",
        url: "#",
        icon: <GaugeIcon />,
        soon: true,
      },
    ],
  },
  {
    label: "Opérations",
    items: [
      {
        title: "Commandes",
        url: "#",
        icon: <ClipboardListIcon />,
        soon: true,
        items: [
          { title: "Nouvelle commande", soon: true },
          { title: "Suivi des commandes", soon: true },
        ],
      },
      {
        title: "Preuves de paiement",
        url: "#",
        icon: <FileCheckIcon />,
        soon: true,
      },
      {
        title: "Paiements et soldes",
        url: "#",
        icon: <BanknoteIcon />,
        soon: true,
        items: [
          { title: "Mes paiements", soon: true },
          { title: "Créances et dettes", soon: true },
        ],
      },
      {
        title: "Dette et reste à payer",
        url: "#",
        icon: <ScaleIcon />,
        soon: true,
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        title: "Paramètres",
        url: "/clients/settings",
        icon: <SettingsIcon />,
      },
      {
        title: "Aide",
        url: "/clients/aide",
        icon: <CircleHelpIcon />,
      },
    ],
  },
]

export type UtilisateurSidebarClient = {
  nom: string
  email: string
  avatar?: string
}

export function ClientSidebar({
  utilisateur,
  profilUrl = "/clients/profil",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  utilisateur?: UtilisateurSidebarClient
  profilUrl?: string
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
              <BrandLogo
                height={28}
                className="shrink-0 group-data-[collapsible=icon]:hidden"
              />
              <BrandLogo
                height={15}
                className="hidden shrink-0 group-data-[collapsible=icon]:inline-flex"
              />
              <span className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">TKS Distribution</span>
                <span className="truncate text-xs text-muted-foreground">
                  Client
                </span>
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-1 py-2">
        {groups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: utilisateur?.nom ?? "Client",
            email: utilisateur?.email ?? "Espace client",
            avatar: utilisateur?.avatar,
          }}
          profilUrl={profilUrl}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
