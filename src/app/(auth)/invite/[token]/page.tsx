import { eq } from "drizzle-orm";
import { AuthShell } from "@/components/auth-shell";
import { Field, FieldGroup } from "@/components/ui/field";
import { db } from "@/lib/db/client";
import { invitationsAgents } from "@/lib/db/schema/s1-comptes";
import { etatLienInvitation } from "@/lib/db/schema/s1-comptes/validation";
import { InviteForm } from "./invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lignes = await db
    .select({
      roleCible: invitationsAgents.roleCible,
      consommeLe: invitationsAgents.consommeLe,
      revoqueLe: invitationsAgents.revoqueLe,
      expireLe: invitationsAgents.expireLe,
    })
    .from(invitationsAgents)
    .where(eq(invitationsAgents.jeton, token));
  const invitation = lignes[0];
  const estAdmin = invitation?.roleCible === "ADMIN_PRINCIPAL";

  // Un lien révoqué, expiré ou déjà utilisé est refusé avant même le
  // formulaire : aucun compte ne peut naître d'un lien annulé.
  if (invitation) {
    // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
    const etat = etatLienInvitation(invitation, Date.now());
    if (etat === "revoque") {
      return (
        <AuthShell
          title="Lien révoqué"
          description="Ce lien d'invitation a été révoqué par un administrateur : plus aucun compte ne peut être créé avec. Demandez un nouveau lien."
        >
          <FieldGroup>
            <Field>
              <p className="text-xs text-muted-foreground">
                Seul un administrateur technique ou un administrateur principal
                validé peut générer un nouveau lien.
              </p>
            </Field>
          </FieldGroup>
        </AuthShell>
      );
    }
    if (etat === "expire") {
      return (
        <AuthShell
          title="Lien expiré"
          description="Ce lien d'invitation a expiré. Demandez un nouveau lien à votre administrateur."
        >
          <FieldGroup>
            <Field>
              <p className="text-xs text-muted-foreground">
                Seul un administrateur peut générer un nouveau lien.
              </p>
            </Field>
          </FieldGroup>
        </AuthShell>
      );
    }
    if (etat === "termine") {
      return (
        <AuthShell
          title="Lien déjà utilisé"
          description="Ce lien a déjà servi à créer un compte. Connectez-vous avec vos identifiants."
        >
          <FieldGroup>
            <Field>
              <p className="text-xs text-muted-foreground">
                Un lien d&apos;invitation est à usage unique.
              </p>
            </Field>
          </FieldGroup>
        </AuthShell>
      );
    }
  }

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
