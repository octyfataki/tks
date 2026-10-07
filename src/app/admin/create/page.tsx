import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { peutCreerAdminPrincipal } from "@/lib/db/schema/s1-comptes";
import { FormulaireAdministrateurPrincipal } from "../administrateurs/formulaire";

/**
 * /admin/create — Créer un administrateur principal (création directe).
 * Le shell SidebarProvider + AdminHeader vit dans /admin/layout : ici,
 * uniquement le contenu. Réservé à un administrateur technique ou
 * principal validé (S1 : peutCreerAdminPrincipal).
 */
export default async function NouveauAdministrateurPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";
  const lignes = email
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.email, email))
    : [];
  const moi = lignes[0];
  const peutCreer = moi ? peutCreerAdminPrincipal(moi.role, moi.etat) : false;

  return (
    <div className="flex flex-1 flex-col">
      {peutCreer ? (
        <FormulaireAdministrateurPrincipal />
      ) : (
        <p className="p-4 text-xs text-muted-foreground">
          Seul un administrateur technique ou un administrateur principal
          validé peut créer ce compte.
        </p>
      )}
    </div>
  );
}
