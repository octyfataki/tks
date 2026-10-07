import Link from "next/link";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { peutCreerAdminPrincipal } from "@/lib/db/schema/s1-comptes";

export default async function Page() {
  // La garde /admin garantit une session staff VALIDE.
  // L'administrateur technique (ou principal) validé crée l'administrateur
  // principal qui gère les dossiers clients. La garde /admin garantit déjà
  // l'espace ADMIN ; ici on n'affiche que le raccourci.
  const profil = await profilSession();
  const peutCreerPrincipal =
    profil.type === "STAFF" &&
    peutCreerAdminPrincipal(profil.role, profil.etat);

  // Le shell SidebarProvider + AppSidebar + AdminHeader vit dans
  // /admin/layout : ici, uniquement le contenu, pour que la sidebar et
  // l'en-tête persistent pendant la navigation client-side.
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        {peutCreerPrincipal ? (
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-medium">
              Créer un administrateur principal
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Le compte du distributeur, qui gère les dossiers clients, les
              agents et les validations.
            </p>
            <Link
              href="/admin/create"
              className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Ouvrir la création
            </Link>
          </div>
        ) : null}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
  );
}
