import { redirect } from "next/navigation";
import { profilSession } from "@/lib/accounts/session-profile";
import { destinationAide } from "@/lib/help-content";

/**
 * /help est un répartiteur, pas une page : chaque type d'utilisateur
 * connecté atterrit sur l'aide de son niveau (gardée par son espace),
 * jamais en accès libre. Même source de décision que les gardes.
 */
export default async function AideDispatchPage() {
  const profil = await profilSession();
  redirect(destinationAide(profil));
}
