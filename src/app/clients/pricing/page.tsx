import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { officialRateOf } from "@/modules/pricing/format";
import { UNITS_PER_DOLLAR } from "@/modules/pricing/price-record";
import { readClientCatalog } from "@/modules/pricing/read-client";
import { ClientNetworkCard } from "./network-card";
import { ClientRateNote } from "./rate-note";
import { toClientEntry } from "./pricing-display";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tarifs — Client — TKS",
  description:
    "Les prix du jour des 100 unités d'airtime pour Orange, Airtel, Africell et Vodacom.",
};

export default async function ClientPricingPage() {
  const { entries, rate } = await readClientCatalog(new Date());
  const rateCdf = rate?.valeur ?? null;
  const officialRate = officialRateOf(rate);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <header>
        <Badge variant="outline">Tarifs</Badge>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          Tarifs du jour
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Le prix d&apos;un dollar d&apos;airtime ({UNITS_PER_DOLLAR} unités)
          pour chaque réseau. Le montant natif fait foi ; l&apos;équivalent
          n&apos;est qu&apos;un repère.
        </p>
      </header>

      <ClientRateNote rate={officialRate} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {entries.map(({ network, price }) => (
          <ClientNetworkCard
            key={network}
            network={network}
            price={price ? toClientEntry(price, rateCdf) : null}
          />
        ))}
      </div>
    </div>
  );
}
