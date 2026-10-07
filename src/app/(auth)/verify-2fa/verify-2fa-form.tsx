"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { demanderDestination } from "@/lib/destination-connexion";
import { MESSAGE_RESEAU, messageErreurSecondFacteur } from "@/lib/erreurs-auth";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// S1-02 : second facteur TOTP obligatoire pour les deux administrateurs, exigé
// à chaque nouvelle session. Sans code valide : pas de session, pas d'accès.
// `trustDevice: false` — jamais mémorisé, chaque session re-vérifie.
export function Verify2faForm() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(form: FormData) {
    setErreur(null);
    setChargement(true);
    try {
      const code = String(form.get("code") ?? "").trim().replace(/\s/g, "");
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: false,
      });
      if (error) throw new Error(messageErreurSecondFacteur(error));
      if (!data) throw new Error("code refusé");
      // Session ouverte : le serveur dit où atterrir (le second facteur
      // n'exige que les administrateurs, mais la décision reste la même).
      const suite = await demanderDestination();
      if (suite.code !== "OK") {
        setErreur("Session introuvable : réessayez.");
        return;
      }
      router.push(suite.destination);
    } catch (e) {
      setErreur(
        e instanceof TypeError
          ? MESSAGE_RESEAU
          : e instanceof Error
            ? e.message
            : "code refusé",
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <form action={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="code">Code de l&apos;application</FieldLabel>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 chiffres"
            minLength={6}
            maxLength={8}
            required
          />
          <FieldDescription>
            Ouvrez votre application d&apos;authentification et saisissez le
            code. Aucun SMS n&apos;est envoyé.
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
            className="w-full font-bold"
            disabled={chargement}
          >
            {chargement ? "Vérification…" : "Vérifier"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
