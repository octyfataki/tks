import { ProfilSquelette } from "@/components/profil";

/**
 * /admin/profil — état de chargement : même coquille que la page
 * (contenu seul, le shell sidebar + AdminHeader vit dans /admin/layout).
 */
export default function ProfilChargement() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <ProfilSquelette />
    </div>
  );
}
