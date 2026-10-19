import { Badge } from "@/components/ui/badge";
import { lireTauxDuJour } from "@/lib/currencies/rates";
import { UNITS_PER_DOLLAR, networkSlug } from "@/modules/pricing/price-record";
import {
  actorCanManagePriceGrid,
  readGridAt,
} from "@/modules/pricing/publish";
import { PricingDenied } from "./denied";
import { NetworkCard } from "./network-card";
import { officialRateOf, toEntry } from "./pricing-display";
import { RateNote } from "./rate-note";

export default async function PriceGridPage() {
  const acteur = await actorCanManagePriceGrid();
  if (!acteur) {
    return <PricingDenied />;
  }

  const instant = new Date();
  const [entrees, taux] = await Promise.all([
    readGridAt(instant),
    lireTauxDuJour(),
  ]);

  const rateCdf = taux?.valeur ?? null;
  const officialRate = officialRateOf(taux);
  const sansPrix = entrees.filter((entree) => entree.price === null).length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <header>
        <Badge variant="outline">Tarifs</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Grille tarifaire
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Un dollar d&apos;airtime vaut {UNITS_PER_DOLLAR} unités ; le prix se
          fixe réseau par réseau. Depuis chaque carte, la saisie prend effet
          immédiatement et s&apos;ajoute à l&apos;historique : les commandes
          déjà passées conservent le leur.
        </p>
      </header>

      {sansPrix > 0 ? (
        <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          {sansPrix === 1
            ? "Un réseau n'a aucun prix : aucune commande ne peut le citer."
            : `${sansPrix} réseaux n'ont aucun prix : aucune commande ne peut les citer.`}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {entrees.map((entree) => (
          <NetworkCard
            key={entree.network}
            network={entree.network}
            slug={networkSlug(entree.network)}
            price={entree.price ? toEntry(entree.price, rateCdf) : null}
            officialRate={officialRate}
          />
        ))}
      </div>

      <RateNote rate={officialRate} />
    </div>
  );
}
