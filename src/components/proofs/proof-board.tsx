import { FileCheckIcon } from "lucide-react";
import type { ProofStats, ProofView } from "@/modules/proofs/read";
import { ProofCard } from "./proof-card";
import { dureeMinutes, montant } from "./proof-format";
import { ProofHistory } from "./proof-history";
import { ProofReadout, type ProofStat } from "./proof-readout";

function lecture(stats: ProofStats): ProofStat[] {
  const [principal, ...autres] = stats.montantEnAttente;
  return [
    {
      label: "Preuves en attente",
      value: String(stats.enAttente),
      hint:
        stats.attenteMinutes === null
          ? "rien à trancher"
          : stats.attenteMinutes < 1
            ? "la plus ancienne vient d'arriver"
            : `la plus ancienne attend ${dureeMinutes(stats.attenteMinutes)}`,
      accent: stats.enAttente > 0,
    },
    {
      label: "Montant en attente",
      value: principal ? montant(principal.amount, principal.currency) : "0",
      hint: principal
        ? autres.length > 0
          ? `plus ${autres
              .map((ligne) => montant(ligne.amount, ligne.currency))
              .join(", ")}`
          : "à vérifier avant de servir"
        : "aucun montant en jeu",
    },
    {
      label: "Validées aujourd'hui",
      value: String(stats.valideesAujourdhui),
      hint: "commandes entrées en file",
      secondary: true,
    },
    {
      label: "Refusées aujourd'hui",
      value: String(stats.refuseesAujourdhui),
      hint: "le client doit redéposer",
      secondary: true,
    },
  ];
}

export function ProofBoard({
  surTitre,
  titre,
  chapeau,
  preuves,
  decisions,
  stats,
  retour,
  message,
  erreur,
}: {
  surTitre: string;
  titre: string;
  chapeau: string;
  preuves: ProofView[];
  decisions: ProofView[];
  stats: ProofStats;
  retour: string;
  message: string | null;
  erreur: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col gap-5 p-4 pt-4">
      <header>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {surTitre}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{titre}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{chapeau}</p>
      </header>

      {message ? (
        <p className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
          {message}
        </p>
      ) : null}
      {erreur ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {erreur}
        </p>
      ) : null}

      <ProofReadout stats={lecture(stats)} />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Preuves en attente</h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {preuves.length}
          </span>
        </div>
        {preuves.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center">
            <FileCheckIcon
              aria-hidden
              className="mx-auto size-7 text-muted-foreground"
            />
            <p className="mt-2 text-sm font-medium">Aucune preuve en attente.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les preuves déposées par les clients arrivent ici et attendent une
              décision.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {preuves.map((preuve) => (
              <ProofCard key={preuve.id} preuve={preuve} retour={retour} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Dernières décisions</h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {decisions.length}
          </span>
        </div>
        <ProofHistory decisions={decisions} />
      </section>
    </div>
  );
}
