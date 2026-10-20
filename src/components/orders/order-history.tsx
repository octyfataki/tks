import { networkLabel } from "@/modules/pricing/price-record";
import type { OrderView } from "@/modules/orders/read";
import { CachetEtat } from "./etat-commande";
import { NetworkThumb } from "./network-thumb";

export function dateCourte(valeur: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valeur);
}

export function OrderHistory({ commandes }: { commandes: OrderView[] }) {
  if (commandes.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm font-medium">Aucune commande terminée</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Les commandes servies ou annulées apparaîtront ici.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
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
        <tbody className="divide-y">
          {commandes.map((commande) => (
            <tr
              key={commande.id}
              className="transition-colors hover:bg-muted/30"
            >
              <td className="max-w-56 px-3 py-2.5">
                <span className="block truncate font-medium">
                  {commande.profileName}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
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
                <CachetEtat etat={commande.state} />
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {commande.lockedByName ?? "—"}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                {dateCourte(commande.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
