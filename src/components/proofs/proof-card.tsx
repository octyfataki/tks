import { networkLabel } from "@/modules/pricing/price-record";
import type { ProofView } from "@/modules/proofs/read";
import { ProofReview } from "./proof-review";

export function dateCourte(valeur: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valeur);
}

export function ProofCard({
  preuve,
  retour,
}: {
  preuve: ProofView;
  retour: string;
}) {
  return (
    <li className="flex flex-col overflow-hidden rounded-lg border">
      {preuve.mime.startsWith("image/") ? (
        <a
          href={`/api/proofs/${preuve.id}`}
          target="_blank"
          rel="noreferrer"
          className="block bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- preuve privée servie par une route protégée */}
          <img
            src={`/api/proofs/${preuve.id}`}
            alt={`Preuve de paiement de ${preuve.profileName}`}
            className="h-52 w-full object-contain"
          />
        </a>
      ) : (
        <a
          href={`/api/proofs/${preuve.id}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-52 items-center justify-center bg-muted text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Ouvrir le fichier ({preuve.mime})
        </a>
      )}
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div>
          <p className="text-sm font-medium">{preuve.profileName}</p>
          <p className="text-xs text-muted-foreground">
            {preuve.profilePhone} · déposée le {dateCourte(preuve.submittedAt)}
          </p>
        </div>
        <p className="text-sm">
          {networkLabel(preuve.network)} ·{" "}
          {preuve.units.toLocaleString("fr-FR")} unités ·{" "}
          <span className="tabular-nums font-medium">
            {preuve.amount.toLocaleString("fr-FR")} {preuve.currency}
          </span>
        </p>
        <ProofReview proofId={preuve.id} retour={retour} />
      </div>
    </li>
  );
}
