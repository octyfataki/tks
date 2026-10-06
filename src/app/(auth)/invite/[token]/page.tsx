import { AuthShell } from "@/components/auth-shell";
import { InviteForm } from "./invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthShell
      title="Invitation agent de service"
      description="Jeton à usage unique, à durée limitée. Le lien fixe le rôle (agent de service), jamais l'identifiant : vous choisissez votre email."
    >
      <InviteForm jeton={token} />
    </AuthShell>
  );
}
