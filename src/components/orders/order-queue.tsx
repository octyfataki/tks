import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderHistory } from "@/components/orders/order-history";
import { OrderRegister } from "@/components/orders/order-register";
import type { OrderView } from "@/modules/orders/read";

export function OrderQueue({
  commandes,
  terminees,
  acteurId,
  canServe,
  canCancel,
  retour,
}: {
  commandes: OrderView[];
  terminees: OrderView[];
  acteurId: string;
  canServe: boolean;
  canCancel: boolean;
  retour: string;
}) {
  const disponibles = commandes.filter((commande) => commande.state === "QUEUED");
  const autres = commandes.filter((commande) => commande.state !== "QUEUED");

  if (commandes.length === 0 && terminees.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm font-medium">Aucune commande ouverte</p>
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

  const ongletInitial =
    disponibles.length > 0
      ? "prendre"
      : autres.length > 0
        ? "cours"
        : "terminees";

  return (
    <Tabs defaultValue={ongletInitial} className="w-full gap-3">
      <TabsList
        aria-label="File des commandes"
        className="inline-flex h-auto w-fit max-w-full flex-wrap items-center gap-1 p-1"
      >
        <TabsTrigger value="prendre" className="flex-none px-3 py-1.5 text-sm">
          À prendre
          <span className="tabular-nums text-muted-foreground">
            {disponibles.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="cours" className="flex-none px-3 py-1.5 text-sm">
          En cours
          <span className="tabular-nums text-muted-foreground">
            {autres.length}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="terminees"
          className="flex-none px-3 py-1.5 text-sm"
        >
          Terminées
          <span className="tabular-nums text-muted-foreground">
            {terminees.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="prendre">{registre(disponibles)}</TabsContent>
      <TabsContent value="cours">
        {autres.length === 0
          ? vide(
              "Aucune commande en cours",
              "Les commandes prises par un agent apparaîtront ici.",
            )
          : registre(autres)}
      </TabsContent>
      <TabsContent value="terminees">
        <OrderHistory commandes={terminees} />
      </TabsContent>
    </Tabs>
  );
}
