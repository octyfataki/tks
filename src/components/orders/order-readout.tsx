import { Readout, type ReadoutStat } from "@/components/readout";

export type OrderStat = ReadoutStat;

export function OrderReadout({ stats }: { stats: OrderStat[] }) {
  return <Readout stats={stats} />;
}
