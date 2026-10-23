"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type OngletNom = "prendre" | "cours" | "terminees";

export type PaginationOnglet = {
  page: number;
  totalPages: number;
  hrefBase: string;
};

const LIBELLES: Record<OngletNom, string> = {
  prendre: "À prendre",
  cours: "En cours",
  terminees: "Terminées",
};

const CLASSES_TRIGGER = "flex-none px-3 py-1.5 text-sm";

export function OrderTabs({
  ongletInitial,
  totaux,
  pagination,
  panneaux,
}: {
  ongletInitial: OngletNom;
  totaux: Record<OngletNom, number>;
  pagination: Record<OngletNom, PaginationOnglet>;
  panneaux: Record<OngletNom, ReactNode>;
}) {
  const routeur = useRouter();
  const [onglet, setOnglet] = useState<OngletNom>(ongletInitial);
  const [ongletServeur, setOngletServeur] = useState<OngletNom>(ongletInitial);

  if (ongletServeur !== ongletInitial) {
    setOngletServeur(ongletInitial);
    setOnglet(ongletInitial);
  }

  const ouvrir = (nom: OngletNom) => {
    setOnglet(nom);
    if (nom !== ongletInitial) {
      routeur.push(pagination[nom].hrefBase);
    }
  };

  return (
    <Tabs
      value={onglet}
      onValueChange={(valeur) => ouvrir(valeur as OngletNom)}
      className="w-full gap-3"
    >
      <TabsList
        aria-label="File des commandes"
        className="inline-flex h-auto w-fit max-w-full flex-wrap items-center gap-1 p-1"
      >
        {(Object.keys(LIBELLES) as OngletNom[]).map((nom) => (
          <TabsTrigger key={nom} value={nom} className={CLASSES_TRIGGER}>
            {LIBELLES[nom]}
            <span className="tabular-nums text-muted-foreground">
              {totaux[nom]}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {(Object.keys(LIBELLES) as OngletNom[]).map((nom) => (
        <TabsContent key={nom} value={nom} className="flex flex-col gap-3">
          {panneaux[nom]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
