import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Field, FieldGroup } from "@/components/ui/field";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { destinationApresConnexion } from "@/lib/s1-comptes/role-session";
import { SignInForm } from "./sign-in-form";

// S1 : la connexion ne se revisite pas. Un compte déjà connecté qui rouvre
// /sign-in (retour navigateur, lien direct) est renvoyé vers son espace —
// /pending pour un client en attente ou refusé, /clients, /agent ou /admin
// sinon. Revoir le formulaire exige une déconnexion préalable : sans ce
// tri, un poste partagé garde un formulaire de connexion devant une
// session ouverte.
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
