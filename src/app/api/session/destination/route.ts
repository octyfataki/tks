import { NextResponse } from "next/server";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { destinationApresConnexion } from "@/lib/s1-comptes/role-session";
import type { CodeDestination } from "@/lib/destination-connexion";

// GET /api/session/destination — dit où atterrit l'utilisateur connecté.
// C'est la seule source du routage post-connexion : le client n'a aucun rôle
// à deviner, il demande au serveur qui relit comptes_staff.
// `REVOQUE` est remonté tel quel pour que le formulaire puisse déconnecter
// et afficher le motif, au lieu d'un aller-retour silencieux sur /sign-in.
export async function GET() {
  const profil = await profilSession();

  let code: CodeDestination = "OK";
  if (profil.type === "STAFF" && profil.etat !== "VALIDE") {
    code = "REVOQUE";
  } else if (profil.type === "ANONYME" || profil.type === "INCONNU") {
    code = "INCONNU";
  }

  return NextResponse.json({
    destination: destinationApresConnexion(profil),
    code,
  });
}
