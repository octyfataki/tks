import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Aucune réinitialisation automatique. Contactez le distributeur avec une pièce d'identité : il ouvre un accès temporaire limité au seul choix d'un nouveau mot de passe."
    >
      <form action="#" method="post">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Adresse email du compte</FieldLabel>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="piece">Pièce d&apos;identité</FieldLabel>
            <Input id="piece" name="piece" type="file" accept="image/*" />
            <FieldDescription>
              La pièce est conservée sur le dossier client pour une vérification
              ultérieure. L&apos;accès temporaire est court et révoqué dès le
              nouveau mot de passe choisi.
            </FieldDescription>
          </Field>
          <Field>
            <Button type="submit" size="lg" className="w-full">
              Envoyer la demande
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </AuthShell>
  );
}
