import Image from "next/image";
import { NETWORK_LOGOS } from "@/components/network-assets";
import { isNetwork, networkLabel } from "@/modules/pricing/price-record";

export function NetworkThumb({ network }: { network: string }) {
  if (!isNetwork(network)) {
    return (
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground"
      >
        ?
      </span>
    );
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-foreground/10">
      <Image
        src={NETWORK_LOGOS[network]}
        alt={networkLabel(network)}
        width={24}
        height={24}
        unoptimized
        className="size-6 object-contain"
      />
    </span>
  );
}
