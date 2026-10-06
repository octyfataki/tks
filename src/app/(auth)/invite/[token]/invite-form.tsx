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

// S1-04 : l'agent choisit email + mot de passe, le rôle AGENT vient du lien.
// Jeton à usage unique, expiré ou consommé -> refus affiché.
export function InviteForm({ jeton }: { jeton: string }) {
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
        name: String(form.get("name") ?? "").trim() || "Agent de service",
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
          <FieldLabel htmlFor="name">Nom</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Nom de l'agent"
          />
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
            {chargement ? "Création…" : "Créer mon compte agent"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
