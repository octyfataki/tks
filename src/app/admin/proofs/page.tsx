import type { Metadata } from "next";
import { FileCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProofCard, dateCourte } from "@/components/proofs/proof-card";
import { PermissionRefusee } from "@/components/permission-denied";
import { staffActorWith } from "@/lib/authorizations/staff-actor";
import { readProofQueue, readRecentDecisions } from "@/modules/proofs/read";

export const metadata: Metadata = {
  title: "Preuves de paiement — Administration — TKS",
  description:
    "Toutes les preuves de paiement en attente : valider ou refuser.",
};

const MESSAGES: Record<string, string> = {
  "proof-validated": "Preuve validée : la commande rejoint la file.",
  "proof-refused": "Preuve refusée. Le client peut en déposer une autre.",
};

export default async function AdminProofsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const acteur = await staffActorWith("preuve.valider");
  if (!acteur) {
    return (
      <PermissionRefusee
        titre="Preuves de paiement"
        detail="Trancher une preuve exige la permission « preuve.valider »."
        action="Le socle de permissions l'accorde déjà à tout agent de service validé."
      />
    );
  }

  const [preuves, decisions] = await Promise.all([
    readProofQueue(),
    readRecentDecisions(15),
  ]);
  const params = await searchParams;
  const message = params.ok ? (MESSAGES[params.ok] ?? params.ok) : null;

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 pt-4">
      <header>
        <Badge variant="outline">Risque financier</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Toutes les preuves
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Les preuves en attente, quel que soit l&apos;agent qui les a
          déposées. Une preuve refusée laisse le client en déposer une autre ;
          l&apos;ancienne reste consultable.
        </p>
      </header>

      {message ? (
        <p className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
          {message}
        </p>
      ) : null}
      {params.erreur ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {params.erreur}
        </p>
      ) : null}

      {preuves.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-10 text-center">
          <FileCheckIcon
            aria-hidden
            className="mx-auto size-7 text-muted-foreground"
          />
          <p className="mt-2 text-sm font-medium">Aucune preuve en attente.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les preuves déposées par les clients apparaissent ici.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {preuves.map((preuve) => (
            <ProofCard key={preuve.id} preuve={preuve} retour="/admin/proofs" />
          ))}
        </ul>
      )}

      {decisions.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Dernières décisions</h2>
          <ul className="divide-y border-y text-sm">
            {decisions.map((decision) => (
              <li
                key={decision.id}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2"
              >
                <span>
                  {decision.profileName} ·{" "}
                  <span className="tabular-nums">
                    {decision.amount.toLocaleString("fr-FR")}{" "}
                    {decision.currency}
                  </span>{" "}
                  · {decision.status === "VALIDATED" ? "validée" : "refusée"}
                  {decision.refusalReason ? ` (${decision.refusalReason})` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {decision.reviewedAt ? dateCourte(decision.reviewedAt) : ""}
                  {decision.reviewedByName ? ` · ${decision.reviewedByName}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
