import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CURRENCIES,
  UNITS_PER_DOLLAR,
  networkLabel,
  type Network,
} from "@/modules/pricing/price-record";
import { NETWORK_BANNERS } from "./network-logo";
import type { OfficialRate, PriceEntry } from "./pricing-display";
import { PriceEditor } from "./price-editor";

export function NetworkCard({
  network,
  slug,
  price,
  officialRate,
}: {
  network: Network;
  slug: string;
  price: PriceEntry | null;
  officialRate: OfficialRate | null;
}) {
  const label = networkLabel(network);
  const href = `/admin/pricing/${slug}`;

  return (
    <Card className="gap-0 py-0">
      <div className="p-2">
        <div className="aspect-[16/10] overflow-hidden rounded-md bg-muted">
          <Image
            src={NETWORK_BANNERS[network]}
            alt=""
            width={1600}
            height={900}
            unoptimized
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <CardHeader className="gap-1 border-t px-4 py-3">
        <CardTitle className="text-sm font-semibold">
          <Link href={href} className="underline-offset-4 hover:underline">
            {label}
          </Link>
        </CardTitle>
        <CardAction>
          {price ? (
            <Badge variant="secondary">En vigueur</Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              Sans prix
            </Badge>
          )}
        </CardAction>
        <CardDescription className="line-clamp-2">
          {price ? (
            <>
              {price.amountLabel} les {UNITS_PER_DOLLAR} unités
              {price.equivalentLabel ? `, soit ${price.equivalentLabel}` : ""}.
            </>
          ) : (
            "Aucun prix : aucune commande ne peut citer ce réseau."
          )}
        </CardDescription>
      </CardHeader>

      <div className="mt-auto border-t p-2">
        <PriceEditor
          network={network}
          current={price}
          currencies={CURRENCIES}
          unitsPerDollar={UNITS_PER_DOLLAR}
          officialRate={officialRate}
          triggerVariant="secondary"
          triggerClassName="w-full"
        />
      </div>
    </Card>
  );
}
