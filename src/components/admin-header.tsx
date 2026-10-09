"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
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
  "/admin/dashboard": [{ etiquette: "Tableau de bord" }],
  "/admin/list": [{ etiquette: "Administrateurs principaux" }],
  "/admin/create": [
    { etiquette: "Administrateurs principaux", href: "/admin/list" },
    { etiquette: "Créer" },
  ],
  "/admin/invites": [{ etiquette: "Invitations" }],
  "/admin/clients": [{ etiquette: "Comptes clients" }],
  "/admin/clients/validation": [
    { etiquette: "Comptes clients", href: "/admin/clients" },
    { etiquette: "Validation" },
  ],
  "/admin/notifications": [
    { etiquette: "Tableau de bord", href: "/admin/dashboard" },
    { etiquette: "Notifications" },
  ],
  "/admin/profil": [
    { etiquette: "Tableau de bord", href: "/admin/dashboard" },
    { etiquette: "Mon compte" },
  ],
  "/admin/aide": [
    { etiquette: "Tableau de bord", href: "/admin/dashboard" },
    { etiquette: "Aide Admin" },
  ],
};

function segmentsPourChemin(chemin: string): Segment[] {
  // Profil d'un administrateur : /admin/list/[id] — l'identifiant n'est
  // jamais affiché tel quel dans le fil d'Ariane.
  if (chemin.startsWith("/admin/list/")) {
    return [
      { etiquette: "Administrateurs principaux", href: "/admin/list" },
      { etiquette: "Profil" },
    ];
  }
  const exacts = FIL_ARIANE_PAR_CHEMIN[chemin];
  if (exacts) return exacts;
  const dernier = chemin.split("/").filter(Boolean).pop();
  if (!dernier) return [{ etiquette: "Tableau de bord" }];
  return [
    { etiquette: "Tableau de bord", href: "/admin/dashboard" },
    { etiquette: dernier },
  ];
}

/**
 * En-tête fixe de l'espace administrateur. Monté une seule fois dans
 * /admin/layout : il persiste pendant la navigation client-side, seul le
 * contenu sous lui change. Le fil d'Ariane est déduit du chemin courant.
 */
export function AdminHeader() {
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
        aideHref="/admin/aide"
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
