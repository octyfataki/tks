import type { Metadata } from "next";
import { FileCheckIcon } from "lucide-react";
import { AgentBientot } from "@/components/agent-bientot";

export const metadata: Metadata = {
  title: "Preuves de paiement — Agent — TKS",
  description:
    "Preuves de paiement téléversées par les clients : valider ou refuser.",
};

/**
 * Preuves de paiement (espace agent). La page existe ; la validation
 * des preuves téléversées par les clients arrive avec S5. Aucune
 * écriture ici.
 */
export default function AgentPreuvesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AgentBientot
        icone={<FileCheckIcon aria-hidden className="size-6" />}
        titre="Preuves de paiement"
        texte="Les preuves téléversées par les clients, à valider ou à refuser."
        suite="Les preuves de paiement arrivent avec S5 — image téléversée par le client, jamais écrasée."
      />
    </div>
  );
}
