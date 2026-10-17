import { redirect } from "next/navigation";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { destinationApresConnexion } from "@/lib/s1-comptes/role-session";
import PendingVue from "./pending-vue";

export default async function PendingPage() {
  const profil = await profilSession();
  if (profil.type !== "ANONYME") {
    const destination = destinationApresConnexion(profil);
    if (destination !== "/pending") redirect(destination);
  }
  return <PendingVue />;
}
