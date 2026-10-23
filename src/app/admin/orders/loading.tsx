import {
  BandeauChargement,
  BarreFiltresChargement,
  OngletsChargement,
} from "@/components/orders/order-skeleton";
import { ReadoutChargement } from "@/components/readout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChargementCommandesAdmin() {
  return (
    <div
      role="status"
      aria-label="Chargement des commandes"
      className="flex flex-1 flex-col gap-4 p-4 pt-4"
    >
      <div>
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="mt-1 h-8 w-56 max-w-full" />
        <Skeleton className="mt-1 h-4 w-80 max-w-full" />
      </div>
      <ReadoutChargement />
      <BandeauChargement />
      <BarreFiltresChargement boutons={6} />
      <OngletsChargement />
    </div>
  );
}
