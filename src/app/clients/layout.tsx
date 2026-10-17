import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GardienSession } from "@/components/session-guard";
import { ClientHeader } from "@/components/client-header";
import { ClientSidebar } from "@/components/client-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { profilSession } from "@/lib/accounts/session-profile";
import { redirectionAcces } from "@/lib/accounts/session-role";

export default async function ClientsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profil = await profilSession();
  const redirection = redirectionAcces(profil, "CLIENTS");
  if (redirection) redirect(redirection);

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
        profilUrl="/clients/profile"
      />
      <SidebarInset>
        <ClientHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
