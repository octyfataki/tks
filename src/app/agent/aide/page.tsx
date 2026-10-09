import type { Metadata } from "next";
import { AideContenu } from "@/components/aide/aide-contenu";

export const metadata: Metadata = {
  title: "Aide Agent — TKS",
  description:
    "Raccourcis du niveau agent de service : comptoir et terrain. Connecté uniquement.",
};

/**
 * Aide de l'espace agent, couverte par la garde /agent. Contenu seul :
 * la coquille navigation + AgentHeader vit dans /agent/layout.
 */
export default function AgentAidePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-4">
      <AideContenu />
    </div>
  );
}
