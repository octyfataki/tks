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
  LayoutDashboardIcon,
  SettingsIcon,
  ScaleIcon,
  UsersIcon,
  WalletIcon,
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
        title: "Gestion des clients",
        url: "/agent/clients",
        icon: <UsersIcon />,
        items: [
          { title: "Liste des comptes", url: "/agent/clients" },
          { title: "Validation", url: "/agent/clients/validation" },
        ],
      },
    ],
  },
  {
    label: "Opérations",
    items: [
      {
        title: "Commandes",
        url: "/agent/orders",
        icon: <ClipboardListIcon />,
        items: [
          { title: "File d'attente", url: "/agent/orders" },
          { title: "Caisse rapide", url: "/agent/orders/new" },
        ],
      },
      {
        title: "Preuves de paiement",
        url: "/agent/proofs",
        icon: <FileCheckIcon />,
      },
      {
        title: "Encaissements",
        url: "/agent/payments",
        icon: <BanknoteIcon />,
      },
      {
        title: "Créances et dettes",
        url: "/agent/receivables",
        icon: <ScaleIcon />,
      },
    ],
  },
  {
    label: "Trésorerie",
    items: [
      {
        title: "Caisse et mobile money",
        url: "/agent/treasury",
        icon: <WalletIcon />,
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        title: "Paramètres",
        url: "/agent/settings",
        icon: <SettingsIcon />,
      },
      {
        title: "Aide",
        url: "/agent/help",
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

export function AgentSidebar({
  utilisateur,
  profilUrl = "/agent/profile",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  utilisateur?: UtilisateurSidebarAgent
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
