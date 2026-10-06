"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type ProfilInscription = "client" | "administrateur";

// Étape 1 d'inscription, IDENTIQUE pour les deux profils : email + téléphone.
// Seule l'URL distingue (/sign-up/client vs /sign-up/administrateur).
// Le téléphone n'est PAS un identifiant de connexion : simple contact,
// stocké côté compte/dossier (non-unique, voir S4). Après envoi, la vraie
// suite arrive par email : le lien de vérification pointe vers l'étape 2
// (callbackURL = hrefEtape2). Le lien « Continuer » ci-dessous n'existe que
// pour la maquette — en production, on ne l'atteint que par l'email.
export function EtapeIdentifiants({
  profil,
  hrefEtape2,
}: {
  profil: ProfilInscription;
  hrefEtape2: string;
}) {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);

  if (envoye) {
    return (
      <FieldGroup>
        <Field>
          <p className="text-xs leading-relaxed">
            Vérifiez votre boîte mail — un lien de vérification a été envoyé à{" "}
            <span className="font-medium">{email}</span>. Une fois votre
            adresse validée, vous compléterez vos informations
            {profil === "client"
              ? " (et votre pièce d'identité, si vous l'avez sous la main)"
              : ""}
            .
          </p>
        </Field>
        <Field>
          <Link
            href={hrefEtape2}
            className="text-xs text-muted-foreground underline underline-offset-4"
          >
            Continuer vers les informations (démonstration — en production, ce
            lien arrive par email)
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
        setEnvoye(true);
      }}
    >
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldDescription>
            C&apos;est avec cet email que vous vous connecterez.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="telephone">Numéro de téléphone</FieldLabel>
          <Input
            id="telephone"
            name="telephone"
            type="tel"
            autoComplete="tel"
            placeholder="+243 …"
            required
          />
          <FieldDescription>
            Simple contact — ce n&apos;est pas votre identifiant de connexion.
          </FieldDescription>
        </Field>
        <Field>
          <Button type="submit" size="lg" className="w-full">
            Vérifier mon adresse email
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
