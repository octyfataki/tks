import type { Metadata } from "next";
import { BanknoteIcon } from "lucide-react";
import { AgentComingSoon } from "@/components/agent-coming-soon";

export const metadata: Metadata = {
  title: "Encaissements — Agent — TKS",
  description:
    "Encaisser au comptoir, en espèces ou en mobile money, et suivre les paiements.",
};

export default function AgentPaymentsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AgentComingSoon
        icon={<BanknoteIcon aria-hidden className="size-6" />}
        title="Encaissements"
        text="Encaisser au comptoir, en espèces ou en mobile money, et voir le solde du paiement."
        upcoming="L'encaissement arrive avec S6 — un paiement, sa devise, son solde."
      />
    </div>
  );
}