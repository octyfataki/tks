import type { Metadata } from "next";
import { FileCheckIcon } from "lucide-react";
import { AgentBientot } from "@/components/agent-coming-soon";

export const metadata: Metadata = {
  title: "Preuves de paiement — Agent — TKS",
  description:
    "Preuves de paiement téléversées par les clients : valider ou refuser.",
};

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
