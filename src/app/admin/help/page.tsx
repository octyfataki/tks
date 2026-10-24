import type { Metadata } from "next";
import { AideContenu } from "@/components/help/help-content";

export const metadata: Metadata = {
  title: "Aide Admin — TKS",
  description:
    "Parcours de l’administrateur : valider les accès, nommer, accorder les permissions, tenir le taux, la trésorerie et la grille tarifaire.",
};

export default async function AdminAidePage() {
  return (
    <div className="flex flex-1 flex-col p-4 pt-4 sm:p-6">
      <main className="mx-auto w-full max-w-6xl">
        <AideContenu niveau="Admin" />
      </main>
    </div>
  );
}
