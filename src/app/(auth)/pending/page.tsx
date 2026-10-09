import { redirect } from "next/navigation";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { destinationApresConnexion } from "@/lib/s1-comptes/role-session";
import PendingVue from "./pending-vue";

// S1 : /pending est la fiche du compte client non validé — elle suit la
// session, pas l'onglet. Seuls EN_ATTENTE_VALIDATION et REFUSE y restent :
// un anonyme retourne à la connexion, un compte validé rejoint son espace
// (client, agent, admin), un compte révoqué/suspendu retourne à la
// connexion. Sans ce tri, la page se revisite hors session et la
// déconnexion n'en ferme pas l'accès (bouton retour du navigateur).
export default async function PendingPage() {
  const profil = await profilSession();
  const destination = destinationApresConnexion(profil);
  if (destination !== "/pending") redirect(destination);
  return <PendingVue />;
}
