import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Field, FieldGroup } from "@/components/ui/field";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <AuthShell
      title="Connexion"
      description="Votre adresse email, puis votre mot de passe — client comme administrateur."
    >
      <SignInForm />
      <FieldGroup className="mt-4">
        <Field>
          <p className="text-xs text-muted-foreground">
            Pas de compte ?{" "}
            <Link href="/sign-up" className="underline underline-offset-4">
              Inscription
            </Link>
            .{" "}
            <Link
              href="/forgot-password"
              className="underline underline-offset-4"
            >
              Mot de passe oublié ?
            </Link>
          </p>
        </Field>
      </FieldGroup>
    </AuthShell>
  );
}
