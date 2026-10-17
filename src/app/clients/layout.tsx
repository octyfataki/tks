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

export default async function ClientsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await profilSession();
  const redirectTarget = redirectionAcces(profile, "CLIENTS");
  if (redirectTarget) redirect(redirectTarget);

  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";
  const name =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Client";

  return (
    <SidebarProvider>
      <GardienSession />
      <ClientSidebar
        utilisateur={{
          nom: name,
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