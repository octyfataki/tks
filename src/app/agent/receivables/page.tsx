import type { Metadata } from "next";
import { ScaleIcon } from "lucide-react";
import { AgentComingSoon } from "@/components/agent-coming-soon";

export const metadata: Metadata = {
  title: "Créances et dettes — Agent — TKS",
  description:
    "Créances des clients et reste à payer dérivé au taux en vigueur.",
};

export default function AgentReceivablesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AgentComingSoon
        icon={<ScaleIcon aria-hidden className="size-6" />}
        title="Créances et dettes"
        text="Ce que chaque client doit : créances suivies séparément, reste à payer dérivé."
        upcoming="Le suivi des dettes arrive avec S6 — paiements fractionnés, ancienneté, avance visible."
      />
    </div>
  );
}
