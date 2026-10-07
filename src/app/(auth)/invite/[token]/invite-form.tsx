"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/password-input";
import { Input } from "@/components/ui/input";
import { accepterInvitation } from "./actions";

// S1-04 : l'invité choisit email + mot de passe, le rôle vient du lien
// (agent de service ou administrateur principal). Jeton à usage unique,
// expiré ou consommé -> refus affiché.
export function InviteForm({
  jeton,
  estAdmin = false,
}: {
  jeton: string;
  estAdmin?: boolean;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(form: FormData) {
    setErreur(null);
    setChargement(true);
    try {
      const res = await accepterInvitation({
        jeton,
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        telephone: String(form.get("telephone") ?? "").trim(),
        name:
          String(form.get("name") ?? "").trim() ||
          (estAdmin ? "Administrateur principal" : "Agent de service"),
      });
      if (!res.ok) throw new Error(res.message);
      router.push("/sign-in");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "invitation refusée");
    } finally {
      setChargement(false);
    }
  }

  return (
    <form action={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nom complet</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder={
              estAdmin
                ? "Nom complet de l'administrateur"
                : "Nom complet de l'agent"
            }
            required
            minLength={2}
          />
          <FieldDescription>
            C&apos;est sous ce nom que le compte sera désigné.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <FieldDescription>
            Un lien expiré ou déjà utilisé est refusé, et l&apos;échec est
            journalisé.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="telephone">
            Téléphone <span className="font-normal">(optionnel)</span>
          </FieldLabel>
          <Input
            id="telephone"
            name="telephone"
            type="tel"
            autoComplete="tel"
            placeholder="+243 …"
          />
          <FieldDescription>
            Contact uniquement — aucune vérification par SMS, la confiance
            passe par l&apos;email.
          </FieldDescription>
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
            {chargement
              ? "Création…"
              : estAdmin
                ? "Créer mon compte administrateur"
                : "Créer mon compte agent"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
