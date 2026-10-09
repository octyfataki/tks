import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { GardienSession } from "@/components/gardien-session";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { redirectionAcces } from "@/lib/s1-comptes/role-session";

/**
 * Garde d'accès à /clients : l'espace du client, et du client seulement.
 * Un staff qui s'y glisse est renvoyé dans son propre espace, un anonyme
 * au login. Inversement, un client poussé vers /admin est renvoyé ici.
 */
export default async function ClientsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profil = await profilSession();
  const redirection = redirectionAcces(profil, "CLIENTS");
  if (redirection) redirect(redirection);
  return (
    <>
      <GardienSession />
      {children}
    </>
  );
}
