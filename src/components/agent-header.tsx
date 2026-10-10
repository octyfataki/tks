"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardHeader,
  ELEMENTS_NOTIFICATIONS_AGENT,
  PanneauNotifications,
} from "@/components/dashboard-header";
import {
  GROUPES_AGENT,
  PaletteRecherche,
} from "@/components/palette-recherche";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Segment = { etiquette: string; href?: string };

const FIL_ARIANE_PAR_CHEMIN: Record<string, Segment[]> = {
  "/agent/dashboard": [{ etiquette: "Tableau de bord" }],
  "/agent/clients": [{ etiquette: "Comptes clients" }],
  "/agent/clients/validation": [
    { etiquette: "Comptes clients", href: "/agent/clients" },
    { etiquette: "Validation" },
  ],
  "/agent/commandes": [{ etiquette: "Commandes" }],
  "/agent/preuves": [{ etiquette: "Preuves de paiement" }],
  "/agent/encaissements": [{ etiquette: "Encaissements" }],
  "/agent/creances": [{ etiquette: "Créances et dettes" }],
  "/agent/profil": [
    { etiquette: "Tableau de bord", href: "/agent/dashboard" },
    { etiquette: "Mon compte" },
  ],
  "/agent/parametres": [
    { etiquette: "Tableau de bord", href: "/agent/dashboard" },
    { etiquette: "Paramètres" },
  ],
  "/agent/aide": [
    { etiquette: "Tableau de bord", href: "/agent/dashboard" },
    { etiquette: "Aide" },
  ],
};

function segmentsPourChemin(chemin: string): Segment[] {
  // Dossier d'un client : /agent/clients/[id] — l'identifiant n'est
  // jamais affiché tel quel dans le fil d'Ariane.
  if (
    chemin.startsWith("/agent/clients/") &&
    chemin !== "/agent/clients/validation"
  ) {
    return [
      { etiquette: "Comptes clients", href: "/agent/clients" },
      { etiquette: "Compte" },
    ];
  }
  const exacts = FIL_ARIANE_PAR_CHEMIN[chemin];
  if (exacts) return exacts;
  const dernier = chemin.split("/").filter(Boolean).pop();
  if (!dernier) return [{ etiquette: "Tableau de bord" }];
  return [
    { etiquette: "Tableau de bord", href: "/agent/dashboard" },
    { etiquette: dernier },
  ];
}

/**
 * En-tête fixe de l'espace agent de service. Monté une seule fois dans
 * /agent/layout : il persiste pendant la navigation client-side, seul le
 * contenu sous lui change. Le fil d'Ariane est déduit du chemin courant.
 *
 * Même coquille que l'espace administrateur (DashboardHeader) : date du
 * jour, taux en vigueur en lecture seule — l'agent n'a pas la permission
 * `taux.saisir` — notifications au périmètre du comptoir, aide de
 * l'espace agent, recherche au périmètre agent.
 */
export function AgentHeader() {
  const chemin = usePathname();
  const segments = segmentsPourChemin(chemin);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator
        orientation="vertical"
        className="mr-1 data-vertical:h-4 data-vertical:self-auto"
      />
      <DashboardHeader
        className="min-w-0 flex-1"
        taux={null}
        peutSaisirTaux={false}
        aideHref="/agent/aide"
        notifications={
          <PanneauNotifications
            elements={ELEMENTS_NOTIFICATIONS_AGENT}
            description="Servir, encaisser, valider — la journée au comptoir."
          />
        }
        recherche={
          <PaletteRecherche
            groupes={GROUPES_AGENT}
            className="w-32 justify-start gap-2 bg-muted/50 px-2 font-normal sm:w-48 lg:w-64"
          />
        }
        filAriane={
          <Breadcrumb aria-label="Fil d'Ariane">
            <BreadcrumbList>
              {segments.map((segment, index) => (
                <span key={segment.etiquette} className="contents">
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {segment.href && index < segments.length - 1 ? (
                      <Link
                        href={segment.href}
                        className="transition-colors hover:text-foreground"
                      >
                        {segment.etiquette}
                      </Link>
                    ) : (
                      <BreadcrumbPage>{segment.etiquette}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
    </header>
  );
}
