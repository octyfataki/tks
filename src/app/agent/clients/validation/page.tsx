import type { Metadata } from "next";
import { UserCheckIcon } from "lucide-react";
import { AgentBientot } from "@/components/agent-bientot";

export const metadata: Metadata = {
  title: "Validation des comptes — Agent — TKS",
  description:
    "Valider un compte client au comptoir après avoir vu une pièce d'identité.",
};

/**
 * Validation des comptes au comptoir (espace agent). La page existe ;
 * l'action métier — valider ou refuser un compte sur pièce vue,
 * journalisée — dépend du contrôle de permission (S2) et arrive après
 * la coquille. Aucune écriture ici.
 */
export default function AgentValidationPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AgentBientot
        icone={<UserCheckIcon aria-hidden className="size-6" />}
        titre="Validation des comptes"
        texte="Valider ou refuser un compte client au comptoir, après avoir vu sa pièce d'identité."
        suite="La validation au comptoir arrive après la coquille — pièce vue exigée, geste journalisé."
      />
    </div>
  );
}
