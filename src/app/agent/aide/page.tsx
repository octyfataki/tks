import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AideContenu } from "@/components/aide/aide-contenu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Aide Agent — TKS",
  description:
    "Raccourcis du niveau agent de service : comptoir et terrain. Connecté uniquement.",
};

/**
 * Aide de l'espace agent, couverte par la garde /agent : même présentation
 * centrée que l'accueil agent, contenu verrouillé sur le niveau Agent.
 */
export default function AgentAidePage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            Espace agent de service
          </span>
          <Link
            href="/agent/dashboard"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <ArrowLeft aria-hidden data-icon="inline-start" />
            Tableau de bord
          </Link>
        </div>
        <AideContenu />
      </div>
    </main>
  );
}
