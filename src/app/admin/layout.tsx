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

/**
 * Garde d'accès à /admin : seul un administrateur (ADMIN_PRINCIPAL ou
 * ADMIN_TECHNIQUE) VALIDE entre. La redirection après connexion est du
 * confort, celle-ci est la sécurité — elle couvre toute l'arborescence,
 * y compris une URL tapée à la main par un client ou un agent.
 *
 * Coquille persistante : SidebarProvider + AppSidebar + AdminHeader vivent
 * ici, pas dans les pages. Avant, chaque page remontait son propre
 * SidebarProvider et son propre <header>, donc chaque navigation
 * démontait/remontait toute la sidebar et l'en-tête (état perdu,
 * impression de rechargement). Ici le layout persiste pendant la
 * navigation client-side, seul le contenu sous l'en-tête change.
 * L'en-tête est fixe (sticky) pour tout l'espace /admin.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profil = await profilSession();
  const redirection = redirectionAcces(profil, "ADMIN");
  if (redirection) redirect(redirection);

  // Nom affiché dans l'encart utilisateur : celui du compte connecté,
  // avec replis neutres si la session est illisible.
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
