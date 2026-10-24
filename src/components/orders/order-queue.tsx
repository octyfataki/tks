import { CheckCheckIcon, HourglassIcon, InboxIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { OrderHistory } from "@/components/orders/order-history";
import { OrderRegister } from "@/components/orders/order-register";
import { OrderTabs } from "@/components/orders/order-tabs";
import { FileVideMessage, type ContenuVide } from "@/components/orders/file-vide";
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

const VIDE_FILTRES: ContenuVide = {
  icone: SearchXIcon,
  titre: "Aucune commande ne correspond",
  detail:
    "Modifiez ou réinitialisez les filtres pour retrouver la file complète.",
};

const VIDE_PAR_ONGLET: Record<OngletNom, ContenuVide> = {
  prendre: {
    icone: InboxIcon,
    titre: "La file est à jour",
    detail:
      "Rien n'attend de prise. Les commandes du comptoir arrivent ici, en tête de file.",
  },
  cours: {
    icone: HourglassIcon,
    titre: "Aucune commande en main",
    detail:
      "Quand un agent prend une commande dans la file, elle s'affiche ici jusqu'au service.",
  },
  terminees: {
    icone: CheckCheckIcon,
    titre: "Le registre est vide",
    detail:
      "Chaque commande servie ou annulée s'inscrit ici, avec son agent et son heure.",
  },
};

const CLASSES_LIEN_CREATION =
  "inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";

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
  filtres,
  creation,
}: OngletsCommandes & {
  acteurId: string;
  canServe: boolean;
  canCancel: boolean;
  retour: string;
  filtres: boolean;
  creation?: { href: string; libelle: string };
}) {
  if (totaux.prendre === 0 && totaux.cours === 0 && totaux.terminees === 0) {
    if (filtres) {
      return (
        <div className="rounded-xl border bg-card">
          <FileVideMessage {...VIDE_FILTRES} />
        </div>
      );
    }
    return (
      <div className="rounded-xl border bg-card">
        <FileVideMessage
          icone={InboxIcon}
          titre="Aucune commande"
          detail="Le comptoir n'a pas de commande ouverte aujourd'hui."
          action={
            creation ? (
              <Link href={creation.href} className={CLASSES_LIEN_CREATION}>
                {creation.libelle}
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }

  const registre = (
    liste: OrderView[],
    nom: OngletNom,
  ): ReactNode => (
    <OrderRegister
      commandes={liste}
      acteurId={acteurId}
      canServe={canServe}
      canCancel={canCancel}
      retour={retour}
      vide={
        filtres
          ? VIDE_FILTRES
          : nom === "prendre" && creation
            ? {
                ...VIDE_PAR_ONGLET.prendre,
                action: (
                  <Link href={creation.href} className={CLASSES_LIEN_CREATION}>
                    {creation.libelle}
                  </Link>
                ),
              }
            : VIDE_PAR_ONGLET[nom]
      }
    />
  );

  const paginationOnglet = (nom: OngletNom) => (
    <PaginationTableau
      page={pagination[nom].page}
      totalPages={pagination[nom].totalPages}
      total={pagination[nom].total}
      hrefBase={pagination[nom].hrefBase}
    />
  );

  const panneaux: Record<OngletNom, ReactNode> = {
    prendre: (
      <>
        {registre(prendre, "prendre")}
        {paginationOnglet("prendre")}
      </>
    ),
    cours: (
      <>
        {registre(cours, "cours")}
        {paginationOnglet("cours")}
      </>
    ),
    terminees: (
      <>
        <OrderHistory
          commandes={terminees}
          vide={filtres ? VIDE_FILTRES : VIDE_PAR_ONGLET.terminees}
        />
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
