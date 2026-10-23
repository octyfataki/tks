import { OrderHistory } from "@/components/orders/order-history";
import { OrderRegister } from "@/components/orders/order-register";
import { OrderTabs } from "@/components/orders/order-tabs";
import type { ReactNode } from "react";
import { PaginationTableau } from "@/components/pagination-tableau";
import type { OrderView } from "@/modules/orders/read";

export type { OngletNom, PaginationOnglet } from "@/components/orders/order-tabs";
import type {
  OngletNom,
  PaginationOnglet,
} from "@/components/orders/order-tabs";

export type OngletsCommandes = {
  ongletInitial: OngletNom;
  prendre: OrderView[];
  cours: OrderView[];
  terminees: OrderView[];
  totaux: { prendre: number; cours: number; terminees: number };
  pagination: Record<OngletNom, PaginationOnglet>;
};

export function OrderQueue({
  ongletInitial,
  prendre,
  cours,
  terminees,
  totaux,
  pagination,
  acteurId,
  canServe,
  canCancel,
  retour,
}: OngletsCommandes & {
  acteurId: string;
  canServe: boolean;
  canCancel: boolean;
  retour: string;
}) {
  if (totaux.prendre === 0 && totaux.cours === 0 && totaux.terminees === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm font-medium">Aucune commande</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Une commande au comptoir se crée en moins d&apos;une minute.
        </p>
      </div>
    );
  }

  const vide = (titre: string, detail: string) => (
    <div className="rounded-xl border bg-card p-6 text-center">
      <p className="text-sm font-medium">{titre}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );

  const registre = (liste: OrderView[]) =>
    liste.length === 0
      ? vide(
          "Rien en attente de prise",
          "La file est vide : la prochaine commande arrivera ici.",
        )
      : (
        <OrderRegister
          commandes={liste}
          acteurId={acteurId}
          canServe={canServe}
          canCancel={canCancel}
          retour={retour}
        />
      );

  const paginationOnglet = (nom: OngletNom) => (
    <PaginationTableau
      page={pagination[nom].page}
      totalPages={pagination[nom].totalPages}
      hrefBase={pagination[nom].hrefBase}
    />
  );

  const panneaux: Record<OngletNom, ReactNode> = {
    prendre: (
      <>
        {registre(prendre)}
        {paginationOnglet("prendre")}
      </>
    ),
    cours: (
      <>
        {cours.length === 0
          ? vide(
              "Aucune commande en cours",
              "Les commandes prises par un agent apparaîtront ici.",
            )
          : registre(cours)}
        {paginationOnglet("cours")}
      </>
    ),
    terminees: (
      <>
        <OrderHistory commandes={terminees} />
        {paginationOnglet("terminees")}
      </>
    ),
  };

  return (
    <OrderTabs
      ongletInitial={ongletInitial}
      totaux={totaux}
      pagination={pagination}
      panneaux={panneaux}
    />
  );
}
