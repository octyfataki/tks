import { redirect } from "next/navigation";
import { profilSession } from "@/lib/accounts/session-profile";
import { destinationAide } from "@/lib/help-content";

export default async function AideDispatchPage() {
  const profil = await profilSession();
  redirect(destinationAide(profil));
}
