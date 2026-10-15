import { redirect } from "next/navigation";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { destinationApresConnexion } from "@/lib/s1-comptes/role-session";

export default async function Home() {
  const profil = await profilSession();
  redirect(destinationApresConnexion(profil));
}
