import { redirect } from "next/navigation";
import { profilSession } from "@/lib/accounts/session-profile";
import { destinationApresConnexion } from "@/lib/accounts/session-role";

export default async function Home() {
  const profil = await profilSession();
  redirect(destinationApresConnexion(profil));
}
