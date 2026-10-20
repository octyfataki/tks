import Link from "next/link";
import { profilSession, peutCreerAdminPrincipal } from "@/lib/accounts/session-profile";

export default async function Page() {
  const profil = await profilSession();
  const peutCreerPrincipal =
    profil.type === "STAFF" &&
    peutCreerAdminPrincipal(profil.role, profil.etat);

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
