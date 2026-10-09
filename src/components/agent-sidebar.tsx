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
  LayoutDashboardIcon,
  SettingsIcon,
  ScaleIcon,
  UserCheckIcon,
} from "lucide-react"

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Pilotage",
    items: [
      {
        title: "Tableau de bord",
        url: "/agent/dashboard",
        icon: <LayoutDashboardIcon />,
        isActive: true,
      },
    ],
  },
  {
    label: "Clients et crédit",
    items: [
      {
        title: "Dossiers clients",
        url: "/agent/clients",
        icon: <FolderOpenIcon />,
        items: [
          { title: "Tous les dossiers", soon: true },
          { title: "Suivi des retards", soon: true },
        ],
      },
      {
        title: "Validation des comptes",
        url: "/agent/clients/validation",
        icon: <UserCheckIcon />,
      },
    ],
  },
  {
    label: "Opérations",
    items: [
      {
        title: "Commandes",
        url: "/agent/commandes",
        icon: <ClipboardListIcon />,
        items: [
          { title: "File d'attente", soon: true },
          { title: "Caisse rapide", soon: true },
        ],
      },
      {
        title: "Preuves de paiement",
        url: "/agent/preuves",
        icon: <FileCheckIcon />,
      },
      {
        title: "Encaissements",
        url: "/agent/encaissements",
        icon: <BanknoteIcon />,
      },
      {
        title: "Créances et dettes",
        url: "/agent/creances",
        icon: <ScaleIcon />,
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        title: "Paramètres",
        url: "/agent/parametres",
        icon: <SettingsIcon />,
      },
      {
        title: "Aide",
        url: "/agent/aide",
        icon: <CircleHelpIcon />,
      },
    ],
  },
]

export type UtilisateurSidebarAgent = {
  nom: string
  email: string
  avatar?: string
}

/**
 * Navigation de l'espace agent de service. Même primitives que la
 * navigation administrateur (NavMain, NavUser, BrandLogo), contenu
 * restreint au terrain : commandes, preuves de paiement,
 * encaissements, créances. Les écrans métier arrivent avec S4 à S6 ;
 * en attendant, les pages existent et annoncent la suite.
 */
export function AgentSidebar({
  utilisateur,
  profilUrl = "/agent/profil",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  utilisateur?: UtilisateurSidebarAgent
  /** Destination de « Mon compte » dans l'encart utilisateur. */
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
                  Agent de service
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
            name: utilisateur?.nom ?? "Agent de service",
            email: utilisateur?.email ?? "Espace agent",
            avatar: utilisateur?.avatar,
          }}
          profilUrl={profilUrl}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
