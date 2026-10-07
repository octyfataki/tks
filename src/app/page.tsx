import { redirect } from "next/navigation";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { destinationApresConnexion } from "@/lib/s1-comptes/role-session";

// Racine : plus la page de démarrage de create-next-app. Ouvrir l'application
// connecté mène à son espace (admin, agent ou client), ouvert anonymement
// mène au login. Même décision que les formulaires, une seule source.
export default async function Home() {
  const profil = await profilSession();
  redirect(destinationApresConnexion(profil));
}
