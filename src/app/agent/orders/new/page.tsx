import type { Metadata } from "next";
import {
  CounterOrderStart,
  type FiltresCaisse,
} from "@/components/orders/counter-order-start";

export const metadata: Metadata = {
  title: "Nouvelle commande — Agent — TKS",
  description: "Caisse rapide : retrouver un client, chiffrer, créer la commande.",
};

export default async function NewCounterOrderPage({
  searchParams,
}: {
  searchParams: Promise<FiltresCaisse>;
}) {
  return (
    <CounterOrderStart
      retour="/agent/orders/new"
      filtres={await searchParams}
    />
  );
}
