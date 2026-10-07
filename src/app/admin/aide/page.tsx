import type { Metadata } from "next";
import { AideContenu } from "@/components/aide/aide-contenu";

export const metadata: Metadata = {
  title: "Aide Admin — TKS",
  description:
    "Raccourcis du niveau administrateur : pilotage, accès, socle. Connecté uniquement.",
};

/**
 * Aide de l'espace administrateur, couverte par la garde /admin.
 * Le shell sidebar + AdminHeader vit dans /admin/layout : ici,
 * uniquement le contenu.
 */
export default async function AdminAidePage() {
  return (
    <div className="flex flex-1 flex-col gap-2 p-4 pt-4">
      <main className="flex flex-col gap-6 py-4">
        <AideContenu />
      </main>
    </div>
  );
}
