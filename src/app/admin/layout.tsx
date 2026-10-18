import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { profilSession } from "@/lib/accounts/session-profile";
import { redirectionAcces } from "@/lib/accounts/session-role";
import { GardienSession } from "@/components/session-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profil = await profilSession();
  const redirection = redirectionAcces(profil, "ADMIN");
  if (redirection) redirect(redirection);

  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";
  const nom =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Administrateur";

  return (
    <SidebarProvider>
      <GardienSession />
      <AppSidebar
        utilisateur={{ nom, email: email || "Espace distributeur" }}
        profilUrl="/admin/profile"
      />
      <SidebarInset>
        <AdminHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
