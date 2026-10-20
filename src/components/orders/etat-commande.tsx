import { Cachet } from "@/components/clients/cachet";

export const LIBELLE_ETAT: Record<string, string> = {
  AWAITING_PROOF: "Attend la preuve",
  QUEUED: "En file",
  LOCKED: "Prise",
  SERVED: "Servie",
  CANCELLED: "Annulée",
};

export function CachetEtat({ etat }: { etat: string }) {
  if (etat === "SERVED") return <Cachet encre="fait">Servie</Cachet>;
  if (etat === "CANCELLED") return <Cachet encre="revoque">Annulée</Cachet>;
  if (etat === "LOCKED") return <Cachet encre="actif">Prise</Cachet>;
  if (etat === "AWAITING_PROOF") {
    return <Cachet encre="attente">Attend la preuve</Cachet>;
  }
  return <Cachet encre="expire">En file</Cachet>;
}
