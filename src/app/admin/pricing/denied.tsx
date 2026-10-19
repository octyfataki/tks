import { PermissionRefusee } from "@/components/permission-denied";

export function PricingDenied() {
  return (
    <PermissionRefusee
      titre="Grille tarifaire"
      detail="Fixer le prix de l'airtime est réservé à l'administrateur principal, ou à un agent qui en a reçu la permission. L'administrateur technique n'y touche jamais."
      action="Demandez la permission « grille.tarif » à l'administrateur principal."
    />
  );
}
