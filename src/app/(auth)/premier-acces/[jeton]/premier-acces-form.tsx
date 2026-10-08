"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/password-input";
import { choisirMotDePassePremierAcces } from "./actions";

// Choix du mot de passe via lien de premier accès : le lien n'ouvre aucune
// session — après ce choix, connexion normale (email + mot de passe + 2FA).
export function PremierAccesForm({ jeton }: { jeton: string }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [termine, setTermine] = useState(false);

  async function onSubmit(form: FormData) {
    setErreur(null);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password !== confirmation) {
      setErreur("les deux mots de passe ne correspondent pas");
      return;
    }
    setChargement(true);
    try {
      const res = await choisirMotDePassePremierAcces({ jeton, password });
      if (!res.ok) throw new Error(res.message);
      setTermine(true);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "lien refusé");
    } finally {
      setChargement(false);
    }
  }

  if (termine) {
    return (
      <FieldGroup>
        <Field>
          <p role="status" className="text-xs font-medium text-green-700">
            Mot de passe enregistré. Connectez-vous : votre second facteur
            sera exigé.
          </p>
        </Field>
        <Field>
          <Link
            href="/sign-in"
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            Aller à la connexion
          </Link>
        </Field>
      </FieldGroup>
    );
  }

  return (
    <form action={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password">Nouveau mot de passe</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <FieldDescription>
            Au moins 8 caractères. Usage unique : ce lien ne resservira plus.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmation">Confirmation</FieldLabel>
          <PasswordInput
            id="confirmation"
            name="confirmation"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        {erreur ? (
          <p role="alert" className="text-xs text-destructive">
            {erreur}
          </p>
        ) : null}
        <Field>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={chargement}
          >
            {chargement ? "Enregistrement…" : "Enregistrer mon mot de passe"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
