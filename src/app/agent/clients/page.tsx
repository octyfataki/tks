import type { Metadata } from "next";
import { FolderOpenIcon } from "lucide-react";
import { AgentBientot } from "@/components/agent-bientot";

export const metadata: Metadata = {
  title: "Dossiers clients — Agent — TKS",
  description:
    "Dossiers des clients suivis par l'agent de service : nom, adresse, créances, plafond.",
};

/**
 * Dossiers clients (espace agent). La page existe et la navigation y
 * mène ; la fiche financière arrive avec S4. Aucune lecture BDD ici —
 * affichage seul.
 */
export default function AgentClientsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AgentBientot
        icone={<FolderOpenIcon aria-hidden className="size-6" />}
        titre="Dossiers clients"
        texte="Retrouver un dossier client par son nom, voir ses créances et son plafond restant."
        suite="Les dossiers clients arrivent avec S4 — fiche financière, homonymes, plafond."
      />
    </div>
  );
}
