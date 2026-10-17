import type { Metadata } from "next";
import { ClipboardListIcon } from "lucide-react";
import { AgentComingSoon } from "@/components/agent-coming-soon";

export const metadata: Metadata = {
  title: "Commandes — Agent — TKS",
  description:
    "File d'attente et caisse rapide : servir les commandes des clients.",
};

export default function AgentOrdersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AgentComingSoon
        icon={<ClipboardListIcon aria-hidden className="size-6" />}
        title="Commandes"
        text="La file d'attente des commandes et la caisse rapide du comptoir."
        upcoming="Les commandes arrivent avec S5 — file d'attente, verrou local, caisse rapide."
      />
    </div>
  );
}
