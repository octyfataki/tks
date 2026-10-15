import { redirect } from "next/navigation";
import { DESTINATION_AGENT } from "@/lib/accounts/session-role";

// /agent sans sous-chemin : la destination de connexion pointe ici, le
// tableau de bord est l'écran d'accueil de l'espace agent.
export default function AgentIndexPage() {
  redirect(`${DESTINATION_AGENT}/dashboard`);
}
