"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  BadgeCheckIcon,
  BanknoteIcon,
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
  ShieldCheckIcon,
  TagsIcon,
  UserCheckIcon,
  UserPlusIcon,
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

type Suggestion = {
  /** Libellé affiché, vocabulaire du domaine (GLOSSARY.md). */
  etiquette: string
  /** Synonymes de recherche, sans aucun terme interdit du glossaire. */
  motsCles?: string[]
  icone: LucideIcon
  /** Destination. Absente = écran pas encore construit (tranches S4+). */
  href?: string
}

type GroupeSuggestions = {
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
const GROUPES: GroupeSuggestions[] = [
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
        etiquette: "Comptes à valider",
        motsCles: ["compte", "validation", "pièce", "identité"],
        icone: UserCheckIcon,
        href: "/admin/pending",
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

export function PaletteRecherche({
  placeholder = "Rechercher…",
  className,
}: {
  placeholder?: string
  className?: string
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
            {GROUPES.map((groupe, index) => (
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
