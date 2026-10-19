import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff, peutModifierReglage } from "@/lib/db/schema/accounts";
import {
  DEFAUT_DUREE_INVITATION_JOURS,
  MAX_DUREE_INVITATION_JOURS,
  MIN_DUREE_INVITATION_JOURS,
} from "@/lib/db/schema/accounts";
import { lireDureeInvitationJours } from "@/lib/accounts/settings";
import { PermissionRefusee } from "@/components/permission-denied";
import { FormulaireParametres } from "./form";

export default async function ParametresPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignes = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignes[0];
  const peutModifier = moi
    ? peutModifierReglage("duree_invitation_jours", moi.role, moi.etat)
    : false;

  if (!peutModifier) {
    return (
      <PermissionRefusee
        titre="Paramètres du système"
        detail="Seul un administrateur technique ou un administrateur principal validé peut consulter et modifier les réglages du système."
      />
    );
  }

  const dureeInvitationJours = await lireDureeInvitationJours();

  return (
    <div className="flex flex-1 flex-col">
      <FormulaireParametres
        dureeInvitationJours={dureeInvitationJours}
        minJours={MIN_DUREE_INVITATION_JOURS}
        maxJours={MAX_DUREE_INVITATION_JOURS}
        defautJours={DEFAUT_DUREE_INVITATION_JOURS}
      />
    </div>
  );
}
