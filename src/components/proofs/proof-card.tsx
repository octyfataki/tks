import { ExternalLinkIcon, FileTextIcon } from "lucide-react";
import { NetworkThumb } from "@/components/orders/network-thumb";
import { networkLabel } from "@/modules/pricing/price-record";
import type { ProofView } from "@/modules/proofs/read";
import { attenteDepuis, dateCourte } from "./proof-format";
import { ProofReview } from "./proof-review";

export function ProofCard({
  preuve,
  retour,
}: {
  preuve: ProofView;
  retour: string;
}) {
  const url = `/api/proofs/${preuve.id}`;
  return (
    <li className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Ouvrir la preuve de ${preuve.profileName} en grand format`}
        className="group relative block border-b bg-muted"
      >
        {preuve.mime.startsWith("image/") ? (
          /* eslint-disable-next-line @next/next/no-img-element -- preuve privée servie par une route protégée */
          <img
            src={url}
            alt={`Preuve de paiement de ${preuve.profileName}`}
            className="h-56 w-full object-contain"
          />
        ) : (
          <span className="flex h-56 flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <FileTextIcon aria-hidden className="size-5" />
            Ouvrir le fichier ({preuve.mime})
          </span>
        )}
        <span
          aria-hidden
          className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-md bg-background/90 text-muted-foreground ring-1 ring-border"
        >
          <ExternalLinkIcon className="size-3.5" />
        </span>
      </a>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex items-start gap-2">
          <NetworkThumb network={preuve.network} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{preuve.profileName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {preuve.profilePhone}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {networkLabel(preuve.network)} ·{" "}
              {preuve.units.toLocaleString("fr-FR")} unités
            </p>
            <p className="truncate text-xs text-muted-foreground">
              déposée le {dateCourte(preuve.submittedAt)} ·{" "}
              {attenteDepuis(preuve.submittedAt)}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums">
            {preuve.amount.toLocaleString("fr-FR")}
            {" "}
            <span className="text-xs font-normal text-muted-foreground">
              {preuve.currency}
            </span>
          </p>
        </div>

        <ProofReview proofId={preuve.id} retour={retour} />
      </div>
    </li>
  );
}
