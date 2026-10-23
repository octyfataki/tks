import { Badge } from "@/components/ui/badge";

export type EtatBloc = "modifiable" | "lecture-seule";

export function PastilleBloc({ etat }: { etat: EtatBloc }) {
  return (
    <Badge
      variant={etat === "modifiable" ? "secondary" : "outline"}
      className="shrink-0 rounded-full"
    >
      {etat === "modifiable" ? "Modifiable" : "Lecture seule"}
    </Badge>
  );
}
