import { FileTextIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { networkLabel } from "@/modules/pricing/price-record";
import type { ProofView } from "@/modules/proofs/read";
import { attenteDepuis } from "./proof-format";
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
    <li className="h-full">
      <Card className="h-full gap-0 py-0">
      <div className="p-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ouvrir la preuve de ${preuve.profileName} en grand format`}
          className="block"
        >
          <div className="h-44 overflow-hidden rounded-md bg-muted">
            {preuve.mime.startsWith("image/") ? (
              /* eslint-disable-next-line @next/next/no-img-element -- preuve privée servie par une route protégée */
              <img
                src={url}
                alt={`Preuve de paiement de ${preuve.profileName}`}
                className="size-full object-cover"
              />
            ) : (
              <span className="flex h-full flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <FileTextIcon aria-hidden className="size-5" />
                Ouvrir le fichier ({preuve.mime})
              </span>
            )}
          </div>
        </a>
      </div>

      <CardHeader className="gap-1 border-t px-3 py-2.5">
        <CardTitle className="text-sm font-semibold">{preuve.profileName}</CardTitle>
        <CardAction>
          <Badge variant="outline">{attenteDepuis(preuve.submittedAt)}</Badge>
        </CardAction>
        <CardDescription className="line-clamp-1">
          {preuve.profilePhone}
        </CardDescription>
      </CardHeader>

      <div className="flex items-baseline justify-between gap-2 px-3 pb-2.5">
        <span className="truncate text-xs text-muted-foreground">
          {networkLabel(preuve.network)} ·{" "}
          {preuve.units.toLocaleString("fr-FR")} unités
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {preuve.amount.toLocaleString("fr-FR")}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            {preuve.currency}
          </span>
        </span>
      </div>

      <div className="mt-auto border-t p-2">
        <ProofReview proofId={preuve.id} retour={retour} />
      </div>
      </Card>
    </li>
  );
}
