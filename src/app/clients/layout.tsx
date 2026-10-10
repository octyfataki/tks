import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GardienSession } from "@/components/gardien-session";
import { ClientHeader } from "@/components/client-header";
import { ClientSidebar } from "@/components/client-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { redirectionAcces } from "@/lib/s1-comptes/role-session";

/**
 * Garde d'accès à /clients : l'espace du client, et du client seulement.
 * Un staff qui s'y glisse est renvoyé dans son propre espace, un anonyme
 * au login. Inversement, un client poussé vers /admin est renvoyé ici.
 *
 * Coquille persistante : SidebarProvider + ClientSidebar + ClientHeader
 * vivent ici, pas dans les pages — même parti pris que /admin/layout et
 * /agent/layout. Le layout persiste pendant la navigation client-side,
 * seul le contenu sous l'en-tête change. L'en-tête est fixe (sticky)
 * pour tout l'espace /clients.
 */
export default async function ClientsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profil = await profilSession();
  const redirection = redirectionAcces(profil, "CLIENTS");
  if (redirection) redirect(redirection);

  // Nom affiché dans l'encart utilisateur : celui du compte connecté,
  // avec replis neutres si la session est illisible.
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";
  const nom =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Client";

  return (
    <SidebarProvider>
      <GardienSession />
      <ClientSidebar
        utilisateur={{
          nom,
          email: email || "Espace client",
          avatar: session?.user?.image ?? undefined,
        }}
        profilUrl="/clients/profil"
      />
      <SidebarInset>
        <ClientHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
