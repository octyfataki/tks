import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Field, FieldGroup } from "@/components/ui/field";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { destinationApresConnexion } from "@/lib/s1-comptes/role-session";
import { SignInForm } from "./sign-in-form";

// Déjà connecté → son espace (le bouton retour ne doit pas rouvrir le
// formulaire). Comparaison stricte comme /pending : un profil INCONNU reste
// sur place au lieu de boucler vers /sign-in.
export default async function SignInPage() {
  const profil = await profilSession();
  const destination = destinationApresConnexion(profil);
  if (destination !== "/sign-in") redirect(destination);
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
