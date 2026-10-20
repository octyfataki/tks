import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NETWORK_BANNERS } from "@/components/network-assets";
import { networkLabel, type Network } from "@/modules/pricing/price-record";
import type { ClientPriceEntry } from "./pricing-display";

export function ClientNetworkCard({
  network,
  price,
}: {
  network: Network;
  price: ClientPriceEntry | null;
}) {
  const label = networkLabel(network);

  return (
    <Card className="flex h-full flex-col gap-0 py-0">
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
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{label}</CardTitle>
          {price ? (
            <Badge variant="secondary">En vigueur</Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              Indisponible
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-4 pb-3">
        {price ? (
          <div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums break-words sm:text-3xl">
              {price.amountLabel}
            </p>
            <p className="text-xs text-muted-foreground">les 100 unités</p>
            {price.equivalentLabel ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {price.equivalentLabel}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun prix publié — commande impossible.
          </p>
        )}
      </CardContent>

      {price ? (
        <p className="mt-auto border-t px-4 py-3 text-xs text-muted-foreground">
          En vigueur depuis le {price.effectiveAtLabel}
        </p>
      ) : null}
    </Card>
  );
}
