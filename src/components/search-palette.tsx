"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  CircleHelpIcon,
  ClipboardListIcon,
  ClockIcon,
  FileCheckIcon,
  FolderOpenIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  PercentIcon,
  ScaleIcon,
  ScrollTextIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TagsIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

export type Suggestion = {
  etiquette: string
  description: string
  motsCles?: string[]
  icone: LucideIcon
  href?: string
}

export type TeinteGroupe = "ambre" | "bleu" | "vert" | "orange" | "violet" | "neutre"

export type GroupeSuggestions = {
  titre: string
  teinte: TeinteGroupe
  elements: Suggestion[]
}

const TEINTES: Record<TeinteGroupe, string> = {
  ambre:
    "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  bleu: "border-blue-600/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  vert: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  orange:
    "border-orange-600/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  violet:
    "border-violet-600/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  neutre: "border-border/60 bg-background text-muted-foreground",
}

const GROUPES_ADMIN: GroupeSuggestions[] = [
  {
    titre: "Pilotage",
    teinte: "ambre",
    elements: [
      {
        etiquette: "Tableau de bord",
        description: "Vue d'ensemble de l'activité et des chiffres du jour.",
        motsCles: ["tableau", "bord", "accueil", "pilotage"],
        icone: LayoutDashboardIcon,
        href: "/admin/dashboard",
      },
      {
        etiquette: "Alertes et réconciliation",
        description: "Conflits de synchronisation et plafonds à trancher.",
        motsCles: ["alerte", "conflit", "réconciliation", "plafond dépassé"],
        icone: AlertTriangleIcon,
      },
    ],
  },
  {
    titre: "Accès",
    teinte: "bleu",
    elements: [
      {
        etiquette: "Comptes clients",
        description: "Rechercher un compte et suivre son état de validation.",
        motsCles: ["compte", "client", "validation", "pièce", "identité"],
        icone: UsersIcon,
        href: "/admin/clients",
      },
      {
        etiquette: "Validation des comptes clients",
        description: "Vérifier les pièces d'identité en attente de décision.",
        motsCles: ["compte", "validation", "attente", "valider"],
        icone: UsersIcon,
        href: "/admin/clients/validation",
      },
      {
        etiquette: "Inviter un agent",
        description: "Créer un lien d'invitation à transmettre à un agent.",
        motsCles: ["agent", "inviter", "service"],
        icone: UserPlusIcon,
        href: "/admin/invites",
      },
      {
        etiquette: "Administrateurs principaux",
        description: "Gérer les administrateurs et leurs permissions.",
        motsCles: ["administrateur", "principal", "distributeur"],
        icone: ShieldCheckIcon,
        href: "/admin/list",
      },
      {
        etiquette: "Mon compte",
        description: "Profil, mot de passe et sécurité de votre compte.",
        motsCles: ["compte", "profil"],
        icone: BadgeCheckIcon,
        href: "/admin/profile",
      },
      {
        etiquette: "Journal d'audit",
        description: "Consulter les actions tracées et leurs auteurs.",
        motsCles: ["audit", "journal", "traçabilité"],
        icone: ScrollTextIcon,
      },
    ],
  },
  {
    titre: "Clients et crédit",
    teinte: "vert",
    elements: [
      {
        etiquette: "Tous les dossiers",
        description: "Parcourir les profils clients et leurs coordonnées.",
        motsCles: ["dossier", "client", "fiches", "nom"],
        icone: FolderOpenIcon,
      },
      {
        etiquette: "Suivi des retards",
        description: "Repérer les clients en retard de paiement.",
        motsCles: ["retard", "impayé", "dette"],
        icone: ClockIcon,
      },
      {
        etiquette: "Statuts et plafonds",
        description: "Statut de crédit et plafond accordé par devise.",
        motsCles: ["statut", "plafond", "privilégié", "évaluation"],
        icone: GaugeIcon,
      },
    ],
  },
  {
    titre: "Opérations",
    teinte: "orange",
    elements: [
      {
        etiquette: "File d'attente des commandes",
        description: "Commandes à servir, dans l'ordre d'arrivée.",
        motsCles: ["commande", "file", "attente", "airtime"],
        icone: ClipboardListIcon,
      },
      {
        etiquette: "Caisse rapide",
        description: "Encaisser une commande au comptoir sans détour.",
        motsCles: ["caisse", "comptoir", "espèces", "rapide"],
        icone: ZapIcon,
      },
      {
        etiquette: "Preuves de paiement",
        description: "Valider ou refuser les preuves mobile money.",
        motsCles: ["preuve", "paiement", "mobile money"],
        icone: FileCheckIcon,
      },
      {
        etiquette: "Encaissements",
        description: "Enregistrer un paiement en espèces ou mobile money.",
        motsCles: ["encaisser", "paiement", "remboursement"],
        icone: BanknoteIcon,
      },
      {
        etiquette: "Créances et dettes",
        description: "Créances par client et reste à payer.",
        motsCles: ["créance", "dette", "reste à payer"],
        icone: ScaleIcon,
      },
    ],
  },
  {
    titre: "Trésorerie et taux",
    teinte: "violet",
    elements: [
      {
        etiquette: "Taux de change",
        description: "Saisir le taux 1 USD = X CDF en vigueur.",
        motsCles: ["taux", "dollar", "usd", "cdf", "change"],
        icone: PercentIcon,
      },
      {
        etiquette: "Grille tarifaire",
        description: "Prix d'une unité d'airtime par réseau.",
        motsCles: ["tarif", "prix", "unité", "réseau"],
        icone: TagsIcon,
        href: "/admin/pricing",
      },
      {
        etiquette: "Caisse et mobile money",
        description: "Soldes de la caisse et des comptes mobile money.",
        motsCles: ["caisse", "mobile money", "trésorerie"],
        icone: WalletIcon,
      },
    ],
  },
]

export const GROUPES_AGENT: GroupeSuggestions[] = [
  {
    titre: "Pilotage",
    teinte: "ambre",
    elements: [
      {
        etiquette: "Tableau de bord",
        description: "Votre journée au comptoir en un coup d'œil.",
        motsCles: ["tableau", "bord", "accueil", "comptoir", "journée"],
        icone: LayoutDashboardIcon,
        href: "/agent/dashboard",
      },
    ],
  },
  {
    titre: "Clients et crédit",
    teinte: "vert",
    elements: [
      {
        etiquette: "Comptes clients",
        description: "Retrouver un client par téléphone, nom ou email.",
        motsCles: ["compte", "client", "connexion", "téléphone", "nom", "email"],
        icone: FolderOpenIcon,
        href: "/agent/clients",
      },
      {
        etiquette: "Validation des comptes",
        description: "Contrôler les pièces d'identité en attente.",
        motsCles: ["compte", "validation", "pièce", "identité", "valider"],
        icone: UserCheckIcon,
        href: "/agent/clients/validation",
      },
    ],
  },
  {
    titre: "Opérations",
    teinte: "orange",
    elements: [
      {
        etiquette: "Commandes",
        description: "Servir les commandes de la file d'attente.",
        motsCles: ["commande", "file", "attente", "servir", "caisse"],
        icone: ClipboardListIcon,
        href: "/agent/orders",
      },
      {
        etiquette: "Preuves de paiement",
        description: "Valider les preuves mobile money reçues.",
        motsCles: ["preuve", "paiement", "mobile money"],
        icone: FileCheckIcon,
        href: "/agent/proofs",
      },
      {
        etiquette: "Encaissements",
        description: "Encaisser un paiement au comptoir.",
        motsCles: ["encaisser", "paiement", "comptoir", "espèces"],
        icone: BanknoteIcon,
        href: "/agent/payments",
      },
      {
        etiquette: "Créances et dettes",
        description: "Suivre ce que chaque client doit encore.",
        motsCles: ["créance", "dette", "reste à payer"],
        icone: ScaleIcon,
        href: "/agent/receivables",
      },
    ],
  },
  {
    titre: "Système",
    teinte: "neutre",
    elements: [
      {
        etiquette: "Mon compte",
        description: "Profil et sécurité de votre compte.",
        motsCles: ["compte", "profil"],
        icone: BadgeCheckIcon,
        href: "/agent/profile",
      },
      {
        etiquette: "Paramètres",
        description: "Session, thème et synchronisation de l'appareil.",
        motsCles: ["paramètres", "réglages", "session", "mot de passe", "thème", "synchronisation", "appareil"],
        icone: SettingsIcon,
        href: "/agent/settings",
      },
      {
        etiquette: "Aide",
        description: "Raccourcis et repères du comptoir.",
        motsCles: ["aide", "raccourcis", "comptoir"],
        icone: CircleHelpIcon,
        href: "/agent/help",
      },
    ],
  },
]

export const GROUPES_CLIENT: GroupeSuggestions[] = [
  {
    titre: "Pilotage",
    teinte: "ambre",
    elements: [
      {
        etiquette: "Votre compte",
        description: "Votre espace, votre solde et vos dernières commandes.",
        motsCles: ["compte", "dossier", "solde", "accueil", "espace"],
        icone: LayoutDashboardIcon,
        href: "/clients",
      },
    ],
  },
  {
    titre: "Mon dossier et crédit",
    teinte: "vert",
    elements: [
      {
        etiquette: "Mon dossier",
        description: "Vos informations commerciales et vos coordonnées.",
        motsCles: ["dossier", "client", "fiche", "nom", "adresse"],
        icone: FolderOpenIcon,
      },
      {
        etiquette: "Statut et plafond",
        description: "Votre statut de crédit et le plafond accordé.",
        motsCles: ["statut", "plafond", "privilégié", "évaluation", "crédit"],
        icone: GaugeIcon,
      },
    ],
  },
  {
    titre: "Opérations",
    teinte: "orange",
    elements: [
      {
        etiquette: "Tarifs",
        description: "Prix d'une unité d'airtime par réseau.",
        motsCles: [
          "tarif",
          "prix",
          "grille",
          "orange",
          "airtel",
          "africell",
          "vodacom",
          "unité",
          "cdf",
          "usd",
        ],
        icone: TagsIcon,
        href: "/clients/pricing",
      },
      {
        etiquette: "Commandes",
        description: "Passer une commande et suivre son état.",
        motsCles: ["commande", "airtime", "unités", "montant", "suivi"],
        icone: ClipboardListIcon,
      },
      {
        etiquette: "Preuves de paiement",
        description: "Téléverser la preuve de votre paiement mobile money.",
        motsCles: ["preuve", "paiement", "mobile money"],
        icone: FileCheckIcon,
      },
      {
        etiquette: "Paiements et soldes",
        description: "Vos paiements et ce qu'ils laissent à payer.",
        motsCles: ["paiement", "encaisser", "remboursement", "solde"],
        icone: BanknoteIcon,
      },
      {
        etiquette: "Dette et reste à payer",
        description: "Le détail de votre dette, exprimé en CDF.",
        motsCles: ["dette", "créance", "reste à payer"],
        icone: ScaleIcon,
      },
    ],
  },
  {
    titre: "Système",
    teinte: "neutre",
    elements: [
      {
        etiquette: "Mon compte",
        description: "Profil et sécurité de votre compte.",
        motsCles: ["compte", "profil", "connexion"],
        icone: BadgeCheckIcon,
        href: "/clients/profile",
      },
      {
        etiquette: "Paramètres",
        description: "Session, thème et synchronisation de l'appareil.",
        motsCles: ["paramètres", "réglages", "session", "mot de passe", "thème", "synchronisation", "appareil"],
        icone: SettingsIcon,
        href: "/clients/settings",
      },
      {
        etiquette: "Aide",
        description: "Raccourcis et réponses aux questions courantes.",
        motsCles: ["aide", "raccourcis", "commande", "dossier"],
        icone: CircleHelpIcon,
        href: "/clients/help",
      },
    ],
  },
]

function CarteSuggestion({
  element,
  valeur,
  teinte,
  onOuvrir,
}: {
  element: Suggestion
  valeur: string
  teinte: TeinteGroupe
  onOuvrir?: () => void
}) {
  const Icone = element.icone

  return (
    <CommandItem
      value={valeur}
      disabled={element.href === undefined}
      onSelect={onOuvrir}
      className="group/carte min-h-12 items-start gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 in-data-[slot=dialog-content]:rounded-lg [&:not(:first-child)]:mt-1.5 data-[disabled=true]:text-muted-foreground data-[disabled=true]:opacity-100 data-selected:border-ring/50 data-selected:bg-muted"
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border",
          TEINTES[teinte],
        )}
      >
        <Icone className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex w-full items-center gap-2">
          <span className="truncate font-medium">{element.etiquette}</span>
          {element.href === undefined ? (
            <Badge variant="secondary" className="ml-auto shrink-0">
              Bientôt
            </Badge>
          ) : null}
        </span>
        <span className="line-clamp-1 text-muted-foreground">
          {element.description}
        </span>
      </span>
    </CommandItem>
  )
}

export function PaletteRecherche({
  placeholder = "Rechercher…",
  className,
  groupes = GROUPES_ADMIN,
}: {
  placeholder?: string
  className?: string
  groupes?: GroupeSuggestions[]
}) {
  const router = useRouter()
  const [ouvert, setOuvert] = React.useState(false)
  const [recherche, setRecherche] = React.useState("")

  React.useEffect(() => {
    const bascule = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOuvert((precedent) => !precedent)
      }
    }
    document.addEventListener("keydown", bascule)
    return () => document.removeEventListener("keydown", bascule)
  }, [])

  const basculer = (etat: boolean) => {
    setOuvert(etat)
    if (!etat) setRecherche("")
  }

  const aller = (href: string) => {
    setRecherche("")
    setOuvert(false)
    router.push(href)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOuvert(true)}
        aria-label={placeholder}
        className="shrink-0 lg:hidden"
      >
        <SearchIcon />
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOuvert(true)}
        aria-label={`${placeholder} (Ctrl+K)`}
        className={cn("hidden lg:inline-flex", className)}
      >
        <SearchIcon />
        <span className="min-w-0 flex-1 truncate text-left font-normal text-muted-foreground">
          {placeholder}
        </span>
        <Kbd className="ml-auto h-4 min-w-4 shrink-0 px-1 leading-none">⌘K</Kbd>
      </Button>
      <CommandDialog
        open={ouvert}
        onOpenChange={basculer}
        title="Recherche"
        description="Rechercher une page ou une action du projet"
        className="top-1/2 -translate-y-1/2"
      >
        <Command label="Recherche" onValueChange={setRecherche}>
          <CommandInput placeholder="Rechercher une page, une action…" />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>
              Aucun résultat — la recherche dans les dossiers clients (par nom,
              avec adresse et solde) arrive avec la tranche S4.
            </CommandEmpty>
            {groupes.map((groupe, index) => (
              <React.Fragment key={groupe.titre}>
                {index > 0 && recherche === "" ? <CommandSeparator /> : null}
                <CommandGroup heading={groupe.titre}>
                  {groupe.elements.map((element) => {
                    const href = element.href
                    return (
                      <CarteSuggestion
                        key={element.etiquette}
                        element={element}
                        teinte={groupe.teinte}
                        valeur={`${groupe.titre} ${element.etiquette} ${(element.motsCles ?? []).join(" ")}`}
                        onOuvrir={href ? () => aller(href) : undefined}
                      />
                    )
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
