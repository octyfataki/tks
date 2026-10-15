import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { peutCreerAdminPrincipal } from "@/lib/db/schema/s1-comptes";
import { PermissionRefusee } from "@/components/permission-refusee";
import { FormulaireAdministrateurPrincipal } from "../administrateurs/formulaire";

export default async function NouveauAdministrateurPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignes = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignes[0];
  const peutCreer = moi ? peutCreerAdminPrincipal(moi.role, moi.etat) : false;

  return (
    <div className="flex flex-1 flex-col">
      {peutCreer ? (
        <FormulaireAdministrateurPrincipal />
      ) : (
        <PermissionRefusee
          titre="Créer un administrateur principal"
          detail="Seul un administrateur technique ou un administrateur principal validé peut créer ce compte."
          action="Votre rôle ne permet pas de créer des administrateurs."
        />
      )}
    </div>
  );
}
