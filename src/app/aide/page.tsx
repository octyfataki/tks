import { redirect } from "next/navigation";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { destinationAide } from "@/lib/aide-content";

export default async function AideDispatchPage() {
  const profil = await profilSession();
  redirect(destinationAide(profil));
}
