import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import type { CompteProfil } from "@/components/profil";
import { ProfilUtilisateur } from "@/components/profil";

// Mon compte (espace agent) : contenu seul, la coquille navigation +
// AgentHeader vit dans /agent/layout. Le même composant
// ProfilUtilisateur, nourri par la session.
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
    <div className="flex flex-1 flex-col bg-background px-6 py-8">
      <ProfilUtilisateur
        nom={nom}
        email={email || "Espace agent"}
        compte={compte}
        dossier={null}
      />
    </div>
  );
}
