import type { Metadata } from "next";
import { ScaleIcon } from "lucide-react";
import { AgentBientot } from "@/components/agent-bientot";

export const metadata: Metadata = {
  title: "Créances et dettes — Agent — TKS",
  description:
    "Créances des clients et reste à payer dérivé au taux en vigueur.",
};

/**
 * Créances et dettes (espace agent). La page existe ; le suivi des
 * dettes — ancienneté sur la date de la créance — arrive avec S6.
 * Montants dérivés, jamais saisis (invariant 1). Aucune écriture ici.
 */
export default function AgentCreancesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AgentBientot
        icone={<ScaleIcon aria-hidden className="size-6" />}
        titre="Créances et dettes"
        texte="Ce que chaque client doit : créances suivies séparément, reste à payer dérivé."
        suite="Le suivi des dettes arrive avec S6 — paiements fractionnés, ancienneté, avance visible."
      />
    </div>
  );
}
