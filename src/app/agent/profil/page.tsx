import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import type { CompteProfil } from "@/components/profil";
import { ProfilUtilisateur } from "@/components/profil";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";

// Mon compte (espace agent) : le même composant ProfilUtilisateur, nourri par
// la session. Quand l'espace agent aura son shell à sidebar, cette page
// l'adoptera comme /admin/profil adopte AppSidebar.
export default async function AgentProfilPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";
  const nom =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Agent de service";

  const profil = await profilSession();
  const compte: CompteProfil =
    profil.type === "STAFF"
      ? { type: "STAFF", role: profil.role, etat: profil.etat }
      : { type: "CLIENT" };

  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl justify-end">
        <BoutonDeconnexion />
      </div>
      <ProfilUtilisateur
        nom={nom}
        email={email || "Espace agent"}
        compte={compte}
        dossier={null}
      />
    </main>
  );
}
