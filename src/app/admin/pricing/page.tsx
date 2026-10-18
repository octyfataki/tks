import { PermissionRefusee } from "@/components/permission-denied";
import { lireTauxDuJour } from "@/lib/currencies/rates";
import {
  CLOSED_NETWORKS,
  CURRENCIES,
  UNITS_PER_DOLLAR,
  amountForUnits,
  networkLabel,
} from "@/modules/pricing/price-record";
import {
  actorCanManagePriceGrid,
  readGridAt,
  readHistory,
  type PriceLineNamed,
} from "@/modules/pricing/publish";
import { PriceGridBoard, type BoardEntry, type BoardRow } from "./price-grid";

const SAMPLE_UNITS = 1_000;

const NOMBRE = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const STAMP = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Kinshasa",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const DAY = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Kinshasa",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function amountLabel(amount: number, currency: string): string {
  return `${NOMBRE.format(amount)} ${currency}`;
}

function equivalentLabel(
  amount: number,
  currency: string,
  rateCdf: number | null,
): string | null {
  if (rateCdf === null || rateCdf <= 0) return null;
  const converted = currency === "CDF" ? amount / rateCdf : amount * rateCdf;
  const target = currency === "CDF" ? "USD" : "CDF";
  return `≈ ${NOMBRE.format(converted)} ${target}`;
}

function toEntry(price: PriceLineNamed, rateCdf: number | null): BoardEntry {
  return {
    amount: price.amount,
    currency: price.currency,
    amountLabel: amountLabel(price.amount, price.currency),
    equivalentLabel: equivalentLabel(price.amount, price.currency, rateCdf),
    sampleLabel: `${NOMBRE.format(
      amountForUnits(price.amount, SAMPLE_UNITS),
    )} ${price.currency}`,
    effectiveAtLabel: STAMP.format(price.effectiveAt),
    authorLabel: price.enteredByName ?? "compte inconnu",
  };
}

export default async function PriceGridPage() {
  const acteur = await actorCanManagePriceGrid();
  if (!acteur) {
    return (
      <PermissionRefusee
        titre="Grille tarifaire"
        detail="Fixer le prix de l'airtime est réservé à l'administrateur principal, ou à un agent qui en a reçu la permission. L'administrateur technique n'y touche jamais."
        action="Demandez la permission « grille.tarif » à l'administrateur principal."
      />
    );
  }

  const instant = new Date();
  const [entrees, taux] = await Promise.all([
    readGridAt(instant),
    lireTauxDuJour(),
  ]);
  const historiques = new Map(
    await Promise.all(
      CLOSED_NETWORKS.map(
        async (network) => [network, await readHistory(network)] as const,
      ),
    ),
  );

  const rateCdf = taux?.valeur ?? null;
  const rows: BoardRow[] = entrees.map((entree) => ({
    network: entree.network,
    label: networkLabel(entree.network),
    current: entree.price ? toEntry(entree.price, rateCdf) : null,
    history: (historiques.get(entree.network) ?? []).map((ligne) =>
      toEntry(ligne, rateCdf),
    ),
  }));

  return (
    <PriceGridBoard
      rows={rows}
      currencies={CURRENCIES}
      unitsPerDollar={UNITS_PER_DOLLAR}
      sampleUnits={SAMPLE_UNITS}
      officialRate={
        taux === null
          ? null
          : {
              value: taux.valeur,
              label: DAY.format(new Date(`${taux.jour}T12:00:00.000Z`)),
            }
      }
    />
  );
}
