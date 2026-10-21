import { networkLabel } from "@/modules/pricing/price-record";
import type { OrderView } from "@/modules/orders/read";
import { CachetEtat } from "./etat-commande";
import { NetworkThumb } from "./network-thumb";
import { OrderActions } from "./order-actions";

export function OrderRegister({
  commandes,
  acteurId,
  canServe,
  canCancel,
  retour,
}: {
  commandes: OrderView[];
  acteurId: string;
  canServe: boolean;
  canCancel: boolean;
  retour: string;
}) {
  return (
    <div className="tks-defilement-masque min-w-0 overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[860px] border-collapse text-left text-xs">
        <caption className="sr-only">Commandes ouvertes</caption>
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
            <th
              scope="col"
              className="hidden px-3 py-2.5 font-medium md:table-cell"
            >
              Agent
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {commandes.map((commande) => (
            <tr key={commande.id} className="transition-colors hover:bg-muted/30">
              <td className="max-w-56 px-3 py-2.5">
                <span className="block truncate font-medium">
                  {commande.profileName}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {commande.profilePhone}
                  {commande.type === "CREDIT" ? " · crédit" : ""}
                  {commande.state === "LOCKED" && commande.lockedByName
                    ? ` · prise par ${commande.lockedByName}`
                    : ""}
                  {commande.lockExpired ? " · verrou expiré" : ""}
                  {commande.state === "AWAITING_PROOF" && commande.refusalReason
                    ? ` · refusée : ${commande.refusalReason}`
                    : ""}
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
              <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                {commande.lockedByName ?? "—"}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex justify-end">
                  <OrderActions
                    orderId={commande.id}
                    state={commande.state}
                    mine={commande.lockedBy === acteurId}
                    canServe={canServe}
                    canCancel={canCancel}
                    retour={retour}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
