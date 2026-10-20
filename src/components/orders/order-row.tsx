import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { networkLabel } from "@/modules/pricing/price-record";
import type { OrderView } from "@/modules/orders/read";
import { NetworkThumb } from "./network-thumb";

export const STATE_LABELS: Record<string, string> = {
  AWAITING_PROOF: "Attend la preuve",
  QUEUED: "En file",
  LOCKED: "Prise",
  SERVED: "Servie",
  CANCELLED: "Annulée",
};

const STATE_BADGES: Record<string, string> = {
  AWAITING_PROOF:
    "border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  QUEUED: "border-border bg-input/20 text-muted-foreground",
  LOCKED: "bg-primary text-primary-foreground",
  SERVED: "bg-secondary text-secondary-foreground",
  CANCELLED: "border-border bg-input/20 text-muted-foreground",
};

export function StateBadge({ state }: { state: string }) {
  return (
    <Badge
      variant="outline"
      className={STATE_BADGES[state] ?? undefined}
    >
      {STATE_LABELS[state] ?? state}
    </Badge>
  );
}

export function OrderRow({
  commande,
  children,
}: {
  commande: OrderView;
  children?: ReactNode;
}) {
  const enAttente = commande.state === "AWAITING_PROOF";
  return (
    <li
      className={`grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 px-3 py-2.5 transition-colors hover:bg-muted/40 sm:grid-cols-[auto_1fr_auto] ${
        enAttente ? "border-l-2 border-dashed border-l-amber-600/60" : ""
      }`}
    >
      <NetworkThumb network={commande.network} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-medium">
            {commande.profileName}
          </span>
          <span className="text-xs text-muted-foreground">
            {commande.profilePhone}
          </span>
          <StateBadge state={commande.state} />
          {commande.type === "CREDIT" ? (
            <Badge variant="outline">Crédit</Badge>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {networkLabel(commande.network)} ·{" "}
          {commande.units.toLocaleString("fr-FR")} unités
          {commande.state === "LOCKED" && commande.lockedByName ? (
            <> · prise par {commande.lockedByName}</>
          ) : null}
          {commande.lockExpired ? <> · verrou expiré</> : null}
          {enAttente && commande.refusalReason ? (
            <> · refusée : {commande.refusalReason}</>
          ) : null}
        </p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
        <span className="text-sm font-semibold tabular-nums">
          {commande.amount.toLocaleString("fr-FR")}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {commande.currency}
          </span>
        </span>
        {children}
      </div>
    </li>
  );
}
