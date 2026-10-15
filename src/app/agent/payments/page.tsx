import type { Metadata } from "next";
import { BanknoteIcon } from "lucide-react";
import { AgentBientot } from "@/components/agent-bientot";

export const metadata: Metadata = {
  title: "Encaissements — Agent — TKS",
  description:
    "Encaisser au comptoir, en espèces ou en mobile money, et suivre les paiements.",
};

/**
 * Encaissements (espace agent). La page existe ; le paiement
 * multi-devises et son solde arrivent avec S6. Aucune écriture ici.
 */
export default function AgentEncaissementsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AgentBientot
        icone={<BanknoteIcon aria-hidden className="size-6" />}
        titre="Encaissements"
        texte="Encaisser au comptoir, en espèces ou en mobile money, et voir le solde du paiement."
        suite="L'encaissement arrive avec S6 — un paiement, sa devise, son solde."
      />
    </div>
  );
}
