import { redirect } from "next/navigation";
import { DESTINATION_ADMIN } from "@/lib/s1-comptes/role-session";

// /admin sans sous-chemin : la destination de connexion pointe ici, le
// tableau de bord est l'écran d'accueil de l'espace administrateur.
export default function AdminIndexPage() {
  redirect(`${DESTINATION_ADMIN}/dashboard`);
}
