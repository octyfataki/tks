"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/password-input";
import { Input } from "@/components/ui/input";
import type { ProfilInscription } from "./etape-identifiants";

// Étape 2 d'inscription, même structure pour les deux profils : nom + mot de
// passe, puis le bloc propre au profil — pièce d'identité (facultative pour
// l'instant) côté client, rappel second facteur côté administrateur.
// Côté client, la pièce peut arriver ici OU au comptoir : la validation du
// compte exige dans tous les cas qu'un humain l'ait vue (S1).
export function EtapeInformations({
  profil,
  hrefTermine,
  labelTermine,
}: {
  profil: ProfilInscription;
  hrefTermine: string;
  labelTermine: string;
}) {
  const [termine, setTermine] = useState(false);

  if (termine) {
    return (
      <FieldGroup>
        <Field>
          <p className="text-xs leading-relaxed">
            {profil === "client"
              ? "Informations enregistrées. Votre compte attend maintenant sa validation sur pièce d'identité."
              : "Compte administrateur créé. Activez votre second facteur à la première connexion."}
          </p>
        </Field>
        <Field>
          <Link
            href={hrefTermine}
            className={buttonVariants({ variant: "outline" }) + " w-full"}
          >
            {labelTermine}
          </Link>
        </Field>
      </FieldGroup>
    );
  }

  return (
    <form
      action="#"
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        setTermine(true);
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nom</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Votre nom"
            required
          />
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
          <FieldDescription>8 caractères minimum.</FieldDescription>
        </Field>
        {profil === "client" ? (
          <Field>
            <FieldLabel htmlFor="piece">Pièce d&apos;identité</FieldLabel>
            <Input id="piece" name="piece" type="file" accept="image/*" />
            <FieldDescription>
              Si vous l&apos;avez sous la main — sinon, présentez-la au
              comptoir. Sans pièce vue par un humain, le compte ne sera pas
              validé.
            </FieldDescription>
          </Field>
        ) : (
          <Field>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Le second facteur (application d&apos;authentification, jamais
              SMS) sera exigé à chaque connexion.
            </p>
          </Field>
        )}
        <Field>
          <Button type="submit" size="lg" className="w-full">
            Finaliser mon inscription
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
