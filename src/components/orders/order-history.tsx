import { Badge } from "@/components/ui/badge";
import { networkLabel } from "@/modules/pricing/price-record";
import type { OrderView } from "@/modules/orders/read";
import { NetworkThumb } from "./network-thumb";

export function dateCourte(valeur: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valeur);
}

function Etat({ commande }: { commande: OrderView }) {
  if (commande.state === "SERVED") {
    return (
      <Badge variant="outline" className="bg-secondary text-secondary-foreground">
        Servie
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Annulée
    </Badge>
  );
}

export function OrderHistory({ commandes }: { commandes: OrderView[] }) {
  if (commandes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
        Aucune commande terminée pour l&apos;instant.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <caption className="sr-only">
          Dernières commandes terminées, tous agents confondus
        </caption>
        <thead>
          <tr className="border-b bg-muted/40 text-muted-foreground">
            <th scope="col" className="px-3 py-2.5 font-medium">
              Client
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Réseau
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-right font-medium"
            >
              Unités
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-right font-medium"
            >
              Montant
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              État
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Par
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Le
            </th>
          </tr>
        </thead>
        <tbody>
          {commandes.map((commande) => (
            <tr
              key={commande.id}
              className="border-b last:border-0 hover:bg-muted/40"
            >
              <td className="px-3 py-2.5">
                <span className="font-medium">{commande.profileName}</span>
                <span className="ml-2 text-muted-foreground">
                  {commande.profilePhone}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span className="flex items-center gap-2">
                  <NetworkThumb network={commande.network} />
                  {networkLabel(commande.network)}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {commande.units.toLocaleString("fr-FR")}
              </td>
              <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                {commande.amount.toLocaleString("fr-FR")}{" "}
                <span className="font-normal text-muted-foreground">
                  {commande.currency}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <Etat commande={commande} />
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {commande.lockedByName ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {dateCourte(commande.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
