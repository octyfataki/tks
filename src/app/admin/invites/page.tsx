import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function AdminInvitesPage() {
  return (
    <AuthShell
      title="Inviter un agent de service"
      description="Le distributeur crée un lien à usage unique et à durée limitée. Le lien ne crée qu'un compte agent de service."
    >
      <form action="#" method="post">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="duree">Durée de validité (jours)</FieldLabel>
            <Input
              id="duree"
              name="duree"
              type="number"
              min={1}
              defaultValue={7}
              required
            />
            <FieldDescription>
              Passé l&apos;expiration, le lien est refusé visiblement et un
              nouveau lien doit être envoyé.
            </FieldDescription>
          </Field>
          <Field>
            <Button type="submit" size="lg" className="w-full">
              Créer le lien d&apos;invitation
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </AuthShell>
  );
}
