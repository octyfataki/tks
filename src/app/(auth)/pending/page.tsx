import { redirect } from "next/navigation";
import { profilSession } from "@/lib/accounts/session-profile";
import { destinationApresConnexion } from "@/lib/accounts/session-role";
import PendingVue from "./pending-view";

export default async function PendingPage() {
  const profil = await profilSession();
  if (profil.type !== "ANONYME") {
    const destination = destinationApresConnexion(profil);
    if (destination !== "/pending") redirect(destination);
  }
  return <PendingVue />;
}
