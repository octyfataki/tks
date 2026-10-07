import type { CompteProfil } from "@/components/profil";
import { ProfilUtilisateur } from "@/components/profil";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Mon compte (espace distributeur) : contenu seul, le shell sidebar +
// AdminHeader vit dans /admin/layout. Données issues de la session,
// jamais saisies (S4 branchera le dossier client rattaché ici).
export default async function AdminProfilPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";
  const nom =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Administrateur";

  const profil = await profilSession();
  const compte: CompteProfil =
    profil.type === "STAFF"
      ? { type: "STAFF", role: profil.role, etat: profil.etat }
      : { type: "CLIENT" };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <ProfilUtilisateur
        nom={nom}
        email={email || "Espace distributeur"}
        compte={compte}
        dossier={null}
      />
    </div>
  );
}
