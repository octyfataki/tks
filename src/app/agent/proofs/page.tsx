import type { Metadata } from "next";
import { FileCheckIcon } from "lucide-react";
import { AgentComingSoon } from "@/components/agent-coming-soon";

export const metadata: Metadata = {
  title: "Preuves de paiement — Agent — TKS",
  description:
    "Preuves de paiement téléversées par les clients : valider ou refuser.",
};

export default function AgentProofsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AgentComingSoon
        icon={<FileCheckIcon aria-hidden className="size-6" />}
        title="Preuves de paiement"
        text="Les preuves téléversées par les clients, à valider ou à refuser."
        upcoming="Les preuves de paiement arrivent avec S5 — image téléversée par le client, jamais écrasée."
      />
    </div>
  );
}
