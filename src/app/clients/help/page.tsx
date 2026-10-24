import type { Metadata } from "next";
import { AideContenu } from "@/components/help/help-content";

export const metadata: Metadata = {
  title: "Aide Client — TKS",
  description:
    "Parcours du client : ouvrir un compte, se connecter, compléter ses pièces, consulter les tarifs et suivre son crédit.",
};

export default function ClientHelpPage() {
  return (
    <div className="flex flex-1 flex-col p-4 pt-4 sm:p-6">
      <main className="mx-auto w-full max-w-6xl">
        <AideContenu niveau="Client" />
      </main>
    </div>
  );
}
