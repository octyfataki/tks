import type { Metadata } from "next";
import { AideContenu } from "@/components/aide/aide-contenu";

export const metadata: Metadata = {
  title: "Aide Client — TKS",
  description:
    "Raccourcis du niveau client : compte, dossier, commandes et soldes. Connecté uniquement.",
};

export default function ClientHelpPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-4">
      <AideContenu niveau="Client" />
    </div>
  );
}
