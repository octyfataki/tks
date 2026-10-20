import { Badge } from "@/components/ui/badge";
import { NetworkThumb } from "@/components/orders/network-thumb";
import { networkLabel } from "@/modules/pricing/price-record";
import type { ProofView } from "@/modules/proofs/read";
import { dateCourte } from "./proof-format";

function DecisionBadge({ status }: { status: ProofView["status"] }) {
  if (status === "VALIDATED") {
    return (
      <Badge variant="outline" className="bg-secondary text-secondary-foreground">
        Validée
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-destructive/40 bg-destructive/10 text-destructive"
    >
      Refusée
    </Badge>
  );
}

export function ProofHistory({ decisions }: { decisions: ProofView[] }) {
  if (decisions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
        Aucune décision pour l&apos;instant.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <caption className="sr-only">
          Décisions récentes prises sur les preuves de paiement
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
              Montant
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Décision
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Motif du refus
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
          {decisions.map((decision) => (
            <tr
              key={decision.id}
              className="border-b last:border-0 hover:bg-muted/40"
            >
              <td className="px-3 py-2.5">
                <span className="font-medium">{decision.profileName}</span>
                <span className="ml-2 text-muted-foreground">
                  · {decision.profilePhone}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span className="flex items-center gap-2">
                  <NetworkThumb network={decision.network} />
                  {networkLabel(decision.network)}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                {decision.amount.toLocaleString("fr-FR")}{" "}
                <span className="font-normal text-muted-foreground">
                  {decision.currency}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <DecisionBadge status={decision.status} />
              </td>
              <td className="max-w-56 px-3 py-2.5 text-muted-foreground">
                <span className="line-clamp-2">
                  {decision.refusalReason ?? "—"}
                </span>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {decision.reviewedByName ?? "—"}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                {decision.reviewedAt ? dateCourte(decision.reviewedAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
