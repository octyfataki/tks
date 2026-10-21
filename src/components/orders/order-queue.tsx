import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderHistory } from "@/components/orders/order-history";
import { OrderRegister } from "@/components/orders/order-register";
import { PaginationTableau } from "@/components/pagination-tableau";
import type { OrderView } from "@/modules/orders/read";

export type PaginationOnglet = {
  page: number;
  totalPages: number;
  hrefBase: string;
};

export type OngletsCommandes = {
  ongletInitial: "prendre" | "cours" | "terminees";
  prendre: OrderView[];
  cours: OrderView[];
  terminees: OrderView[];
  totaux: { prendre: number; cours: number; terminees: number };
  pagination: PaginationOnglet;
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
  if (
    totaux.prendre === 0 &&
    totaux.cours === 0 &&
    totaux.terminees === 0
  ) {
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

  const paginationOnglet = (
    <PaginationTableau
      page={pagination.page}
      totalPages={pagination.totalPages}
      hrefBase={pagination.hrefBase}
    />
  );

  return (
    <Tabs defaultValue={ongletInitial} className="w-full gap-3">
      <TabsList
        aria-label="File des commandes"
        className="inline-flex h-auto w-fit max-w-full flex-wrap items-center gap-1 p-1"
      >
        <TabsTrigger value="prendre" className="flex-none px-3 py-1.5 text-sm">
          À prendre
          <span className="tabular-nums text-muted-foreground">
            {totaux.prendre}
          </span>
        </TabsTrigger>
        <TabsTrigger value="cours" className="flex-none px-3 py-1.5 text-sm">
          En cours
          <span className="tabular-nums text-muted-foreground">
            {totaux.cours}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="terminees"
          className="flex-none px-3 py-1.5 text-sm"
        >
          Terminées
          <span className="tabular-nums text-muted-foreground">
            {totaux.terminees}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="prendre" className="flex flex-col gap-3">
        {registre(prendre)}
        {paginationOnglet}
      </TabsContent>

      <TabsContent value="cours" className="flex flex-col gap-3">
        {cours.length === 0
          ? vide(
              "Aucune commande en cours",
              "Les commandes prises par un agent apparaîtront ici.",
            )
          : registre(cours)}
        {paginationOnglet}
      </TabsContent>

      <TabsContent value="terminees" className="flex flex-col gap-3">
        <OrderHistory commandes={terminees} />
        {paginationOnglet}
      </TabsContent>
    </Tabs>
  );
}
