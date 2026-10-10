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

export type Suggestion = {
  /** Libellé affiché, vocabulaire du domaine (GLOSSARY.md). */
  etiquette: string
  /** Synonymes de recherche, sans aucun terme interdit du glossaire. */
  motsCles?: string[]
  icone: LucideIcon
  /** Destination. Absente = écran pas encore construit (tranches S4+). */
  href?: string
}

export type GroupeSuggestions = {
  titre: string
  elements: Suggestion[]
}

/**
 * Points de recherche de la palette, calqués sur le menu et les specs :
 * - Pilotage et Accès : les écrans qui existent déjà ;
 * - Clients et crédit (S4), Opérations (S5–S6), Trésorerie et taux (S3, S7) :
 *   affichés désactivés avec « Bientôt » tant que la tranche n'est pas
 *   construite — jamais de lien mort.
 */
const GROUPES_ADMIN: GroupeSuggestions[] = [
  {
    titre: "Pilotage",
    elements: [
      {
        etiquette: "Tableau de bord",
        motsCles: ["tableau", "bord", "accueil", "pilotage"],
        icone: LayoutDashboardIcon,
        href: "/admin/dashboard",
      },
      {
        etiquette: "Alertes et réconciliation",
        motsCles: ["alerte", "conflit", "réconciliation", "plafond dépassé"],
        icone: AlertTriangleIcon,
      },
    ],
  },
  {
    titre: "Accès",
    elements: [
      {
        etiquette: "Comptes clients",
        motsCles: ["compte", "client", "validation", "pièce", "identité"],
        icone: UsersIcon,
        href: "/admin/clients",
      },
      {
        etiquette: "Validation des comptes clients",
        motsCles: ["compte", "validation", "attente", "valider"],
        icone: UsersIcon,
        href: "/admin/clients/validation",
      },
      {
        etiquette: "Inviter un agent",
        motsCles: ["agent", "inviter", "service"],
        icone: UserPlusIcon,
        href: "/admin/invites",
      },
      {
        etiquette: "Administrateurs principaux",
        motsCles: ["administrateur", "principal", "distributeur"],
        icone: ShieldCheckIcon,
        href: "/admin/list",
      },
      {
        etiquette: "Mon compte",
        motsCles: ["compte", "profil"],
        icone: BadgeCheckIcon,
        href: "/admin/profil",
      },
      {
        etiquette: "Journal d'audit",
        motsCles: ["audit", "journal", "traçabilité"],
        icone: ScrollTextIcon,
      },
    ],
  },
  {
    titre: "Clients et crédit",
    elements: [
      {
        etiquette: "Tous les dossiers",
        motsCles: ["dossier", "client", "fiches", "nom"],
        icone: FolderOpenIcon,
      },
      {
        etiquette: "Suivi des retards",
        motsCles: ["retard", "impayé", "dette"],
        icone: ClockIcon,
      },
      {
        etiquette: "Statuts et plafonds",
        motsCles: ["statut", "plafond", "privilégié", "évaluation"],
        icone: GaugeIcon,
      },
    ],
  },
  {
    titre: "Opérations",
    elements: [
      {
        etiquette: "File d'attente des commandes",
        motsCles: ["commande", "file", "attente", "airtime"],
        icone: ClipboardListIcon,
      },
      {
        etiquette: "Caisse rapide",
        motsCles: ["caisse", "comptoir", "espèces", "rapide"],
        icone: ZapIcon,
      },
      {
        etiquette: "Preuves de paiement",
        motsCles: ["preuve", "paiement", "mobile money"],
        icone: FileCheckIcon,
      },
      {
        etiquette: "Encaissements",
        motsCles: ["encaisser", "paiement", "remboursement"],
        icone: BanknoteIcon,
      },
      {
        etiquette: "Créances et dettes",
        motsCles: ["créance", "dette", "reste à payer"],
        icone: ScaleIcon,
      },
    ],
  },
  {
    titre: "Trésorerie et taux",
    elements: [
      {
        etiquette: "Taux de change",
        motsCles: ["taux", "dollar", "usd", "cdf", "change"],
        icone: PercentIcon,
      },
      {
        etiquette: "Grille tarifaire",
        motsCles: ["tarif", "prix", "unité", "réseau"],
        icone: TagsIcon,
      },
      {
        etiquette: "Caisse et mobile money",
        motsCles: ["caisse", "mobile money", "trésorerie"],
        icone: WalletIcon,
      },
    ],
  },
]

/**
 * Points de recherche de l'espace agent de service, calqués sur la
 * navigation terrain : servir, encaisser, valider. Chaque entrée mène
 * à une page qui existe — aucun lien mort, aucun « Bientôt ».
 */
export const GROUPES_AGENT: GroupeSuggestions[] = [
  {
    titre: "Pilotage",
    elements: [
      {
        etiquette: "Tableau de bord",
        motsCles: ["tableau", "bord", "accueil", "comptoir", "journée"],
        icone: LayoutDashboardIcon,
        href: "/agent/dashboard",
      },
    ],
  },
  {
    titre: "Clients et crédit",
    elements: [
      {
        etiquette: "Comptes clients",
        motsCles: ["compte", "client", "connexion", "téléphone", "nom", "email"],
        icone: FolderOpenIcon,
        href: "/agent/clients",
      },
      {
        etiquette: "Validation des comptes",
        motsCles: ["compte", "validation", "pièce", "identité", "valider"],
        icone: UserCheckIcon,
        href: "/agent/clients/validation",
      },
    ],
  },
  {
    titre: "Opérations",
    elements: [
      {
        etiquette: "Commandes",
        motsCles: ["commande", "file", "attente", "servir", "caisse"],
        icone: ClipboardListIcon,
        href: "/agent/commandes",
      },
      {
        etiquette: "Preuves de paiement",
        motsCles: ["preuve", "paiement", "mobile money"],
        icone: FileCheckIcon,
        href: "/agent/preuves",
      },
      {
        etiquette: "Encaissements",
        motsCles: ["encaisser", "paiement", "comptoir", "espèces"],
        icone: BanknoteIcon,
        href: "/agent/encaissements",
      },
      {
        etiquette: "Créances et dettes",
        motsCles: ["créance", "dette", "reste à payer"],
        icone: ScaleIcon,
        href: "/agent/creances",
      },
    ],
  },
  {
    titre: "Système",
    elements: [
      {
        etiquette: "Mon compte",
        motsCles: ["compte", "profil"],
        icone: BadgeCheckIcon,
        href: "/agent/profil",
      },
      {
        etiquette: "Paramètres",
        motsCles: ["paramètres", "réglages", "session", "mot de passe", "thème", "synchronisation", "appareil"],
        icone: SettingsIcon,
        href: "/agent/parametres",
      },
      {
        etiquette: "Aide",
        motsCles: ["aide", "raccourcis", "comptoir"],
        icone: CircleHelpIcon,
        href: "/agent/aide",
      },
    ],
  },
]

export function PaletteRecherche({
  placeholder = "Rechercher…",
  className,
  groupes = GROUPES_ADMIN,
}: {
  placeholder?: string
  className?: string
  /** Périmètre de recherche : administrateur par défaut, agent si fourni. */
  groupes?: GroupeSuggestions[]
}) {
  const router = useRouter()
  const [ouvert, setOuvert] = React.useState(false)

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

  const aller = (href: string) => {
    setOuvert(false)
    router.push(href)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOuvert(true)}
        aria-label={`${placeholder} (Ctrl+K)`}
        className={className}
      >
        <SearchIcon />
        <span className="min-w-0 flex-1 truncate text-left font-normal text-muted-foreground">
          {placeholder}
        </span>
        <Kbd className="ml-auto h-4 min-w-4 shrink-0 px-1 leading-none">⌘K</Kbd>
      </Button>
      <CommandDialog
        open={ouvert}
        onOpenChange={setOuvert}
        title="Recherche"
        description="Rechercher une page ou une action du projet"
      >
        <Command label="Recherche">
          <CommandInput placeholder="Rechercher une page, une action…" />
          <CommandList>
            <CommandEmpty>
              Aucun résultat — la recherche dans les dossiers clients (par nom,
              avec adresse et solde) arrive avec la tranche S4.
            </CommandEmpty>
            {groupes.map((groupe, index) => (
              <React.Fragment key={groupe.titre}>
                {index > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading={groupe.titre}>
                  {groupe.elements.map((element) => {
                    const Icone = element.icone
                    return (
                      <CommandItem
                        key={element.etiquette}
                        value={`${groupe.titre} ${element.etiquette} ${(element.motsCles ?? []).join(" ")}`}
                        disabled={element.href === undefined}
                        onSelect={
                          element.href
                            ? () => aller(element.href as string)
                            : undefined
                        }
                      >
                        <Icone />
                        {element.etiquette}
                        {element.href === undefined ? (
                          <Badge variant="secondary">Bientôt</Badge>
                        ) : null}
                      </CommandItem>
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
