"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";

// S1 : connexion unique email + mot de passe pour tous — client comme staff.
// Sans second facteur admin -> refus : Better Auth répond `twoFactorRedirect`,
// on envoie vers /verify-2fa. Pas d'écran d'attente : le bouton porte l'état
// (« Connexion… », désactivé) pendant l'appel.
export function SignInForm() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(form: FormData) {
    setErreur(null);
    setChargement(true);
    try {
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");
      const { data, error } = await authClient.signIn.email(
        { email, password },
        {
          onSuccess: (ctx) => {
            if (
              ctx.data &&
              typeof ctx.data === "object" &&
              "twoFactorRedirect" in ctx.data &&
              (ctx.data as { twoFactorRedirect?: boolean }).twoFactorRedirect
            ) {
              router.push("/verify-2fa");
            } else {
              router.push("/dashboard");
            }
          },
        },
      );
      if (error) throw new Error(error.message ?? "connexion refusée");
      if (!data) router.push("/dashboard");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "connexion refusée");
    } finally {
      setChargement(false);
    }
  }

  return (
    <form action={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Adresse email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nom@exemple.cd"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
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
            className="w-full font-bold"
            disabled={chargement}
          >
            {chargement ? "Connexion…" : "Se connecter"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
