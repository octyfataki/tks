"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/password-input";
import { RedirigerConnecte } from "@/components/rediriger-connecte";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { inscrireCompteClient } from "./actions";

const CLE_INSCRIPTION = "tks-inscription";
const VERSION_INSCRIPTION = 1;

function memoriserInscription(patch: Record<string, string | number>) {
  try {
    const brut = sessionStorage.getItem(CLE_INSCRIPTION);
    const actuel = brut
      ? (JSON.parse(brut) as { v?: number; data?: Record<string, string | number> })
      : undefined;
    if (actuel?.v !== VERSION_INSCRIPTION) {
      sessionStorage.setItem(
        CLE_INSCRIPTION,
        JSON.stringify({ v: VERSION_INSCRIPTION, data: {} }),
      );
    }
    const data =
      actuel?.v === VERSION_INSCRIPTION ? actuel.data! : {};
    sessionStorage.setItem(
      CLE_INSCRIPTION,
      JSON.stringify({ v: VERSION_INSCRIPTION, data: { ...data, ...patch } }),
    );
  } catch {
  }
}

export default function SignUpPage() {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);

  const soumettreInfos = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const name = String(form.get("name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const telephone = String(form.get("telephone") ?? "").trim();
      const password = String(form.get("password") ?? "");
      setChargement(true);
      const resultat = await inscrireCompteClient({
        email,
        password,
        name,
        telephone,
      });
      setChargement(false);
      if (!resultat.ok) {
        toast.add({
          type: "error",
          title: "Inscription refusée",
          description: resultat.erreur,
        });
        return;
      }
      memoriserInscription({ name, email, telephone, at: Date.now() });
      if (!resultat.session) {
        toast.add({
          type: "info",
          title: "Compte créé",
          description:
            "Connectez-vous pour déposer votre pièce d'identité et suivre votre demande.",
        });
        router.push("/sign-in");
        return;
      }
      router.push("/pending");
    },
    [router],
  );

  return (
    <AuthShell
      title="Inscription client"
      description="Tout se remplit ici, sur cette page. Votre compte est créé immédiatement ; il attend une vérification par un humain."
    >
      <RedirigerConnecte />
      <form action="#" method="post" onSubmit={soumettreInfos}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nom complet</FieldLabel>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Nom complet ou appellation commerciale"
              required
              minLength={2}
            />
            <FieldDescription>
              C&apos;est sous ce nom que votre profil sera désigné et confirmé
              à voix haute.
            </FieldDescription>
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
          <Field>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={chargement}
            >
              {chargement ? "Création…" : "Créer mon compte client"}
            </Button>
          </Field>
          <Field>
            <p className="text-xs text-muted-foreground">
              Après l&apos;envoi, vous arrivez sur la page de suivi. C&apos;est
              là que vous déposez votre pièce d&apos;identité, et que vous
              suivez l&apos;avancement de votre demande.
            </p>
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
      </form>
    </AuthShell>
  );
}
