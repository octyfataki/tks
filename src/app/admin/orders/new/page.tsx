import type { Metadata } from "next";
import {
  CounterOrderStart,
  type FiltresCaisse,
} from "@/components/orders/counter-order-start";

export const metadata: Metadata = {
  title: "Nouvelle commande — Administration — TKS",
  description: "Caisse rapide : retrouver un client, chiffrer, créer la commande.",
};

export default async function NewAdminCounterOrderPage({
  searchParams,
}: {
  searchParams: Promise<FiltresCaisse>;
}) {
  return (
    <CounterOrderStart
      retour="/admin/orders/new"
      filtres={await searchParams}
    />
  );
}
