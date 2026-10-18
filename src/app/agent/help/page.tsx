import type { Metadata } from "next";
import { AideContenu } from "@/components/help/help-content";

export const metadata: Metadata = {
  title: "Aide Agent — TKS",
  description:
    "Raccourcis du niveau agent de service : comptoir et terrain. Connecté uniquement.",
};

export default function AgentHelpPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-4">
      <AideContenu />
    </div>
  );
}
