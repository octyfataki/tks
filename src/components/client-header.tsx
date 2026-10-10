"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardHeader,
  ELEMENTS_NOTIFICATIONS_CLIENT,
  PanneauNotifications,
} from "@/components/dashboard-header";
import {
  GROUPES_CLIENT,
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
  "/clients": [{ etiquette: "Votre compte" }],
  "/clients/profil": [
    { etiquette: "Votre compte", href: "/clients" },
    { etiquette: "Mon compte" },
  ],
  "/clients/aide": [
    { etiquette: "Votre compte", href: "/clients" },
    { etiquette: "Aide" },
  ],
};

function segmentsPourChemin(chemin: string): Segment[] {
  const exacts = FIL_ARIANE_PAR_CHEMIN[chemin];
  if (exacts) return exacts;
  const dernier = chemin.split("/").filter(Boolean).pop();
  if (!dernier) return [{ etiquette: "Votre compte" }];
  return [
    { etiquette: "Votre compte", href: "/clients" },
    { etiquette: dernier },
  ];
}

/**
 * En-tête fixe de l'espace client. Monté une seule fois dans
 * /clients/layout : il persiste pendant la navigation client-side, seul le
 * contenu sous lui change. Le fil d'Ariane est déduit du chemin courant.
 *
 * Même coquille que les espaces administrateur et agent de service
 * (DashboardHeader) : date du jour, taux en vigueur en lecture seule — le
 * client n'a pas la permission `taux.saisir` — notifications à son
 * périmètre (dossier, commandes, soldes), aide de l'espace client,
 * recherche au périmètre client.
 */
export function ClientHeader() {
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
        aideHref="/clients/aide"
        notifications={
          <PanneauNotifications
            elements={ELEMENTS_NOTIFICATIONS_CLIENT}
            description="Dossier, commandes et soldes — votre compte client."
          />
        }
        recherche={
          <PaletteRecherche
            groupes={GROUPES_CLIENT}
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
