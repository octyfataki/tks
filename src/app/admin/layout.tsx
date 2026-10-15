import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { redirectionAcces } from "@/lib/s1-comptes/role-session";
import { GardienSession } from "@/components/gardien-session";
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
        profilUrl="/admin/profil"
      />
      <SidebarInset>
        <AdminHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
