"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Store } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/password-input";
import { Input } from "@/components/ui/input";

type Profil = "client" | "administrateur";

// S1 (maquette non câblée) : inscription unifiée — même porte d'entrée pour
// tous, en email + mot de passe. On choisit d'abord le profil (deux boutons
// façon providers), puis on voit les champs. Client -> compte
// EN_ATTENTE_VALIDATION (validation humaine sur pièce d'identité).
// Administrateur -> compte staff VALIDE avec second facteur obligatoire.
// Contrainte au câblage : la branche administrateur ne doit jamais être une
// auto-inscription ouverte — création réservée (bootstrap premier compte,
// ou administrateur existant via `creerAdminPrincipal`), le proxy bloque déjà
// `/api/auth/sign-up` en public.
export default function SignUpPage() {
  const [profil, setProfil] = useState<Profil | null>(null);

  return (
    <AuthShell
      title="Inscription"
      description={
        profil === null
          ? "Qui êtes-vous ? Choisissez votre profil pour continuer."
          : profil === "client"
            ? "Une adresse email et un mot de passe suffisent. Présentez ensuite une pièce d'identité au comptoir, et vous pourrez commander."
            : "Créez votre compte administrateur : email et mot de passe, second facteur obligatoire à la connexion."
      }
    >
      {profil === null ? (
        <FieldGroup>
          <Field>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-auto w-full justify-start gap-3 p-3 text-left"
              onClick={() => setProfil("client")}
            >
              <Store className="size-5 shrink-0" />
              <span>
                <span className="block text-sm font-semibold">
                  Je suis un client
                </span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Je commande du crédit airtime
                </span>
              </span>
            </Button>
          </Field>
          <Field>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-auto w-full justify-start gap-3 p-3 text-left"
              onClick={() => setProfil("administrateur")}
            >
              <ShieldCheck className="size-5 shrink-0" />
              <span>
                <span className="block text-sm font-semibold">
                  Je suis un administrateur
                </span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Je gère la plateforme et les comptes
                </span>
              </span>
            </Button>
          </Field>
          <Field>
            <p className="text-xs text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link href="/sign-in" className="underline underline-offset-4">
                Connexion
              </Link>
              .
            </p>
          </Field>
        </FieldGroup>
      ) : (
        <form action="#" method="post">
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
              <FieldLabel htmlFor="email">Adresse email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nom@exemple.cd"
                required
              />
              <FieldDescription>
                C&apos;est avec cet email que vous vous connecterez.
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
              <FieldDescription>
                {profil === "client"
                  ? "8 caractères minimum."
                  : "8 caractères minimum. Le second facteur (application d'authentification) reste obligatoire à la connexion."}
              </FieldDescription>
            </Field>
            <Field>
              <Button type="submit" size="lg" className="w-full">
                {profil === "client"
                  ? "Créer mon compte client"
                  : "Créer mon compte administrateur"}
              </Button>
            </Field>
            <Field>
              <p className="text-xs text-muted-foreground">
                {profil === "client" ? (
                  <>
                    Après l&apos;inscription, voir{" "}
                    <Link
                      href="/pending"
                      className="underline underline-offset-4"
                    >
                      l&apos;écran d&apos;attente
                    </Link>
                    .{" "}
                  </>
                ) : null}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={() => setProfil(null)}
                >
                  Changer de profil
                </button>
              </p>
            </Field>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  );
}
