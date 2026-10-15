import type { Metadata } from "next";
import { ClipboardListIcon } from "lucide-react";
import { AgentBientot } from "@/components/agent-bientot";

export const metadata: Metadata = {
  title: "Commandes — Agent — TKS",
  description:
    "File d'attente et caisse rapide : servir les commandes des clients.",
};

export default function AgentCommandesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AgentBientot
        icone={<ClipboardListIcon aria-hidden className="size-6" />}
        titre="Commandes"
        texte="La file d'attente des commandes et la caisse rapide du comptoir."
        suite="Les commandes arrivent avec S5 — file d'attente, verrou local, caisse rapide."
      />
    </div>
  );
}
