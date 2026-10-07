import { eq } from "drizzle-orm";
import { AuthShell } from "@/components/auth-shell";
import { db } from "@/lib/db/client";
import { invitationsAgents } from "@/lib/db/schema/s1-comptes";
import { InviteForm } from "./invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lignes = await db
    .select({ roleCible: invitationsAgents.roleCible })
    .from(invitationsAgents)
    .where(eq(invitationsAgents.jeton, token));
  const estAdmin = lignes[0]?.roleCible === "ADMIN_PRINCIPAL";

  return (
    <AuthShell
      title={
        estAdmin
          ? "Invitation administrateur principal"
          : "Invitation agent de service"
      }
      description={
        estAdmin
          ? "Jeton à usage unique, à durée limitée. Le lien fixe le rôle (administrateur principal), jamais l'identifiant : vous choisissez votre email."
          : "Jeton à usage unique, à durée limitée. Le lien fixe le rôle (agent de service), jamais l'identifiant : vous choisissez votre email."
      }
    >
      <InviteForm jeton={token} estAdmin={estAdmin} />
    </AuthShell>
  );
}
