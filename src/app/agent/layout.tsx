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

export default async function AgentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profil = await profilSession();
  const redirection = redirectionAcces(profil, "AGENT");
  if (redirection) redirect(redirection);

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
