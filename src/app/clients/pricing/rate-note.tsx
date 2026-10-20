import { NOMBRE, type OfficialRate } from "@/modules/pricing/format";

export function ClientRateNote({ rate }: { rate: OfficialRate | null }) {
  if (!rate) {
    return (
      <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
        Taux du jour non publié — les équivalents en CDF/USD ne sont pas
        affichés. Les prix natifs restent valables.
      </p>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      Taux du {rate.label} : 1 USD = {NOMBRE.format(rate.value)} CDF. Les
      équivalents sont indicatifs ; le prix natif fait foi.
    </p>
  );
}
