import { Readout, type ReadoutStat } from "@/components/readout";

export type ProofStat = ReadoutStat;

export function ProofReadout({ stats }: { stats: ProofStat[] }) {
  return <Readout stats={stats} />;
}
