import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";

export default function PendingPage() {
  return (
    <AuthShell
      title="Compte en attente de validation"
      description="Votre compte est EN_ATTENTE_VALIDATION. Il ne peut rien faire : ni dossier, ni solde, ni commande — pas même prépayée."
    >
      <FieldGroup>
        <Field>
          <p className="text-xs leading-relaxed">
            Apportez une pièce d&apos;identité au comptoir, ou déposez-la
            depuis l&apos;écran de mot de passe oublié. Un humain du
            distributeur ou un agent de service doit la voir avant de valider
            le compte, puis de rattacher le compte au dossier client désigné
            par son nom.
          </p>
        </Field>
        <Field>
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "outline" }) + " w-full"}
          >
            Se déconnecter
          </Link>
        </Field>
      </FieldGroup>
    </AuthShell>
  );
}
