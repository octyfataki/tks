import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { redirectionAcces } from "@/lib/s1-comptes/role-session";

/**
 * Garde d'accès à /agent : seul un agent de service VALIDE entre.
 * Les administrateurs y sont renvoyés vers leur propre espace, un client
 * vers le sien — même logique que /admin, une seule source de décision.
 */
export default async function AgentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profil = await profilSession();
  const redirection = redirectionAcces(profil, "AGENT");
  if (redirection) redirect(redirection);
  return <>{children}</>;
}
