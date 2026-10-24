import type { Metadata } from "next";
import { AideContenu } from "@/components/help/help-content";

export const metadata: Metadata = {
  title: "Aide Agent — TKS",
  description:
    "Parcours de l’agent de service : valider un compte, lire une fiche, tenir la caisse et le mobile money.",
};

export default function AgentHelpPage() {
  return (
    <div className="flex flex-1 flex-col p-4 pt-4 sm:p-6">
      <main className="mx-auto w-full max-w-6xl">
        <AideContenu niveau="Agent" />
      </main>
    </div>
  );
}
