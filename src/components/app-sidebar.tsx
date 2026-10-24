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
  AlertTriangleIcon,
  BanknoteIcon,
  ClipboardListIcon,
  FolderOpenIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  PercentIcon,
  ScaleIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TagsIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Pilotage",
    items: [
      {
        title: "Tableau de bord",
        url: "/admin/dashboard",
        icon: <LayoutDashboardIcon />,
        isActive: true,
      },
      {
        title: "Alertes et réconciliation",
        url: "#",
        icon: <AlertTriangleIcon />,
        soon: true,
        items: [
          { title: "Preuves en attente", soon: true },
          { title: "Conflits ouverts", soon: true },
          { title: "Cas de plafond dépassé", soon: true },
        ],
      },
    ],
  },
  {
    label: "Accès",
    items: [
      {
        title: "Administrateurs principaux",
        url: "/admin/list",
        icon: <ShieldCheckIcon />,
        items: [
          {
            title: "Liste des admins",
            url: "/admin/list",
          },
          {
            title: "Créer un administrateur principal",
            url: "/admin/create",
          },
          {
            title: "Inviter un administrateur principal",
            url: "/admin/invites?cible=admin",
          },
          {
            title: "Invitations envoyées",
            url: "/admin/invitations",
          },
        ],
      },
      {
        title: "Gestion des clients",
        url: "/admin/clients",
        icon: <UsersIcon />,
        items: [
          { title: "Liste des comptes", url: "/admin/clients" },
          { title: "Validation", url: "/admin/clients/validation" },
        ],
      },
      {
        title: "Agents de service",
        url: "/admin/agents",
        icon: <UserPlusIcon />,
        items: [
          { title: "Liste des agents", url: "/admin/agents" },
          { title: "Créer un agent", url: "/admin/agents/create" },
          { title: "Inviter un agent", url: "/admin/invites?cible=agent" },
          { title: "Invitations agents", url: "/admin/agents/invitations" },
          { title: "Permissions des agents", url: "/admin/agents/permissions" },
        ],
      },
      {
        title: "Journal d'audit",
        url: "/admin/audit-log",
        icon: <ScrollTextIcon />,
      },
    ],
  },
  {
    label: "Clients et crédit",
    items: [
      {
        title: "Dossiers clients",
        url: "#",
        icon: <FolderOpenIcon />,
        soon: true,
        items: [
          { title: "Tous les dossiers", soon: true },
          { title: "Suivi des retards", soon: true },
        ],
      },
      {
        title: "Statuts et plafonds",
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
        url: "/admin/orders",
        icon: <ClipboardListIcon />,
        items: [
          { title: "Toutes les commandes", url: "/admin/orders" },
          { title: "Caisse rapide", url: "/admin/orders/new" },
          { title: "Preuves de paiement", url: "/admin/proofs" },
        ],
      },
      {
        title: "Encaissements",
        url: "#",
        icon: <BanknoteIcon />,
        soon: true,
      },
      {
        title: "Créances et dettes",
        url: "#",
        icon: <ScaleIcon />,
        soon: true,
      },
    ],
  },
  {
    label: "Trésorerie et taux",
    items: [
      {
        title: "Caisse et mobile money",
        url: "#",
        icon: <WalletIcon />,
        soon: true,
        items: [
          { title: "Comptes", soon: true },
          { title: "Mouvements", soon: true },
          { title: "Transferts", soon: true },
        ],
      },
      {
        title: "Taux de change",
        url: "#",
        icon: <PercentIcon />,
        soon: true,
      },
      {
        title: "Grille tarifaire",
        url: "/admin/pricing",
        icon: <TagsIcon />,
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        title: "Paramètres",
        url: "/admin/settings",
        icon: <SettingsIcon />,
      },
    ],
  },
]

export type UtilisateurSidebar = {
  nom: string
  email: string
  avatar?: string
}

export function AppSidebar({
  utilisateur,
  profilUrl = "/admin/profile",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  utilisateur?: UtilisateurSidebar
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
                  Administrateur
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
            name: utilisateur?.nom ?? "Administrateur",
            email: utilisateur?.email ?? "Espace distributeur",
            avatar: utilisateur?.avatar,
          }}
          profilUrl={profilUrl}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
