import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ProfilUtilisateur } from "@/components/profil";

// Mon compte (espace client) : le même composant ProfilUtilisateur, nourri
// par la session. Le dossier rattaché arrivera avec S4 ; en attendant,
// l'état vide normatif s'affiche (aucun dossier, aucun solde).
export default async function ClientsProfilPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";
  const nom =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Client";

  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 py-8">
      <ProfilUtilisateur
        nom={nom}
        email={email || "Espace client"}
        compte={{ type: "CLIENT" }}
        dossier={null}
      />
    </main>
  );
}
