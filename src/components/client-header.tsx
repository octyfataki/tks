"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import {
  DashboardHeader,
  ELEMENTS_NOTIFICATIONS_CLIENT,
  PanneauNotifications,
} from "@/components/dashboard-header";
import {
  GROUPES_CLIENT,
  PaletteRecherche,
} from "@/components/search-palette";
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
  "/clients/pricing": [
    { etiquette: "Votre compte", href: "/clients" },
    { etiquette: "Tarifs" },
  ],
  "/clients/profile": [
    { etiquette: "Votre compte", href: "/clients" },
    { etiquette: "Mon compte" },
  ],
  "/clients/settings": [
    { etiquette: "Votre compte", href: "/clients" },
    { etiquette: "Paramètres" },
  ],
  "/clients/help": [
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
      <BrandLogo height={24} className="shrink-0 md:hidden" />
      <DashboardHeader
        className="min-w-0 flex-1"
        aideHref="/clients/help"
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
