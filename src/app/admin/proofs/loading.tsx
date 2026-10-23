import {
  DecisionsChargement,
  FilePreuvesChargement,
} from "@/components/proofs/proof-skeleton";
import { ReadoutChargement } from "@/components/readout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChargementPreuvesAdmin() {
  return (
    <div
      role="status"
      aria-label="Chargement des preuves de paiement"
      className="flex flex-1 flex-col gap-5 p-4 pt-4"
    >
      <header>
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="mt-1 h-8 w-56 max-w-full" />
        <Skeleton className="mt-1 h-4 w-96 max-w-2xl" />
      </header>
      <ReadoutChargement />
      <FilePreuvesChargement />
      <DecisionsChargement />
    </div>
  );
}
