"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DateDuJour } from "@/components/taux-du-jour";
import { ModeToggle } from "@/components/mode-toggle";

type Segment = { etiquette: string; href?: string };

const FIL_ARIANE_PAR_CHEMIN: Record<string, Segment[]> = {
  "/agent/dashboard": [{ etiquette: "Tableau de bord" }],
  "/agent/clients": [{ etiquette: "Dossiers clients" }],
  "/agent/clients/validation": [
    { etiquette: "Dossiers clients", href: "/agent/clients" },
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
  "/agent/aide": [
    { etiquette: "Tableau de bord", href: "/agent/dashboard" },
    { etiquette: "Aide" },
  ],
};

function segmentsPourChemin(chemin: string): Segment[] {
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
 * contenu sous lui change. Volontairement sobre — terrain, téléphone,
 * réseau instable : date du jour, aide, thème. Le taux en vigueur et la
 * recherche arriveront avec S3 et le périmètre agent.
 */
export function AgentHeader() {
  const chemin = usePathname();
  const router = useRouter();
  const segments = segmentsPourChemin(chemin);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator
        orientation="vertical"
        className="mr-1 data-vertical:h-4 data-vertical:self-auto"
      />
      <div className="hidden min-w-0 flex-1 md:block">
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
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <DateDuJour />
        <Button
          variant="outline"
          size="icon"
          aria-label="Aide"
          onClick={() => router.push("/agent/aide")}
        >
          <CircleHelpIcon />
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
}
