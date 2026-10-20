import { NOMBRE, type OfficialRate } from "./pricing-display";

export function RateNote({ rate }: { rate: OfficialRate | null }) {
  return (
    <p className="text-xs text-muted-foreground">
      {rate
        ? `Taux du ${rate.label} : ${NOMBRE.format(rate.value)} CDF pour 1 USD. Le chiffre qui engage est celui de la devise du prix ; l'équivalent n'est qu'un repère.`
        : "Aucun taux en vigueur : les équivalents ne s'affichent pas. Ils reviendront avec le taux."}
    </p>
  );
}
