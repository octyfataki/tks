import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import {
  peutInviterAdminPrincipal,
  peutInviterAgent,
} from "@/lib/db/schema/accounts";
import { lireDureeInvitationJours } from "@/lib/accounts/settings";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PermissionRefusee } from "@/components/permission-denied";
import { FormulaireInvitationAdmin } from "../administrators/invitation-form";
import { FormulaireInvitationAgent } from "./form";

export default async function InviterPage({
  searchParams,
}: {
  searchParams: Promise<{ cible?: string }>;
}) {
  const { cible } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignes = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignes[0];
  const peutInviterAdmin = moi
    ? peutInviterAdminPrincipal(moi.role, moi.etat)
    : false;
  const peutInviterAgentRole = moi ? peutInviterAgent(moi.role, moi.etat) : false;

  if (!peutInviterAdmin && !peutInviterAgentRole) {
    return (
      <PermissionRefusee
        titre="Inviter un membre du personnel"
        detail="Seul un administrateur principal ou technique validé peut inviter un membre du personnel."
        action="Votre rôle ne permet pas d'envoyer des invitations."
      />
    );
  }

  const defautDureeInvitation = await lireDureeInvitationJours();

  const seulOnglet = peutInviterAdmin && !peutInviterAgentRole ? "admin" : null;

  if (seulOnglet) {
    return (
      <div className="flex flex-1 flex-col">
        <FormulaireInvitationAdmin
          defautJours={defautDureeInvitation}
        />
      </div>
    );
  }

  const ongletDefaut =
    cible === "admin" && peutInviterAdmin ? "admin" : "agent";

  return (
    <div className="flex flex-1 flex-col">
      <Tabs
        key={ongletDefaut}
        defaultValue={ongletDefaut}
        className="flex flex-1 flex-col"
      >
        <div className="px-4 pt-4">
          <TabsList aria-label="Qui inviter">
            {peutInviterAdmin ? (
              <TabsTrigger value="admin">
                Administrateur principal
              </TabsTrigger>
            ) : null}
            {peutInviterAgentRole ? (
              <TabsTrigger value="agent">Agent de service</TabsTrigger>
            ) : null}
          </TabsList>
        </div>
        {peutInviterAdmin ? (
          <TabsContent value="admin">
            <FormulaireInvitationAdmin
              defautJours={defautDureeInvitation}
            />
          </TabsContent>
        ) : null}
        {peutInviterAgentRole ? (
          <TabsContent value="agent">
            <FormulaireInvitationAgent
              defautJours={defautDureeInvitation}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
