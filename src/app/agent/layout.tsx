import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { redirectionAcces } from "@/lib/s1-comptes/role-session";
import { GardienSession } from "@/components/gardien-session";
import { AgentHeader } from "@/components/agent-header";
import { AgentSidebar } from "@/components/agent-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Garde d'accès à /agent : seul un agent de service VALIDE entre.
 * Les administrateurs y sont renvoyés vers leur propre espace, un client
 * vers le sien — même logique que /admin, une seule source de décision.
 *
 * Coquille persistante : SidebarProvider + AgentSidebar + AgentHeader
 * vivent ici, pas dans les pages — même parti pris que /admin/layout.
 * Ici le layout persiste pendant la navigation client-side, seul le
 * contenu sous l'en-tête change. L'en-tête est fixe (sticky) pour tout
 * l'espace /agent.
 */
export default async function AgentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profil = await profilSession();
  const redirection = redirectionAcces(profil, "AGENT");
  if (redirection) redirect(redirection);

  // Nom affiché dans l'encart utilisateur : celui du compte connecté,
  // avec replis neutres si la session est illisible.
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";
  const nom =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Agent de service";

  return (
    <SidebarProvider>
      <GardienSession />
      <AgentSidebar
        utilisateur={{
          nom,
          email: email || "Espace agent",
          avatar: session?.user?.image ?? undefined,
        }}
        profilUrl="/agent/profil"
      />
      <SidebarInset>
        <AgentHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
