import { redirect } from "next/navigation";
import { DESTINATION_AGENT } from "@/lib/s1-comptes/role-session";

// /agent sans sous-chemin : la destination de connexion pointe ici, le
// tableau de bord est l'écran d'accueil de l'espace agent.
export default function AgentIndexPage() {
  redirect(`${DESTINATION_AGENT}/dashboard`);
}
