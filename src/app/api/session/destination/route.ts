import { NextResponse } from "next/server";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { destinationApresConnexion } from "@/lib/s1-comptes/role-session";
import type { CodeDestination } from "@/lib/destination-connexion";

export async function GET() {
  const profil = await profilSession();

  let code: CodeDestination = "OK";
  if (profil.type === "STAFF" && profil.etat === "SUSPENDU") {
    code = "SUSPENDU";
  } else if (profil.type === "STAFF" && profil.etat !== "VALIDE") {
    code = "REVOQUE";
  } else if (profil.type === "CLIENT" && profil.etat === "EN_ATTENTE_VALIDATION") {
    code = "EN_ATTENTE";
  } else if (profil.type === "CLIENT" && profil.etat === "REFUSE") {
    code = "REFUSE";
  } else if (profil.type === "CLIENT" && profil.etat !== "VALIDE") {
    code = "REVOQUE";
  } else if (profil.type === "ANONYME" || profil.type === "INCONNU") {
    code = "INCONNU";
  }

  return NextResponse.json({
    destination: destinationApresConnexion(profil),
    code,
  });
}
