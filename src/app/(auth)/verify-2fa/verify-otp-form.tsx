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

// S1-02 (variante email) : code à 6 chiffres envoyé par email, valable
// 5 minutes. Même exigence que le TOTP : sans code valide, pas de session,
// pas d'accès. `trustDevice: false` — jamais mémorisé.
export function VerifyOtpForm() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function envoyerCode() {
    setErreur(null);
    setChargement(true);
    try {
      const { error } = await authClient.twoFactor.sendOtp({ trustDevice: false });
      if (error) throw new Error(messageErreurSecondFacteur(error));
      setEnvoye(true);
    } catch (e) {
      setErreur(
        e instanceof TypeError
          ? MESSAGE_RESEAU
          : e instanceof Error
            ? e.message
            : "Envoi refusé.",
      );
    } finally {
      setChargement(false);
    }
  }

  async function onSubmit(form: FormData) {
    setErreur(null);
    setChargement(true);
    try {
      const code = String(form.get("code") ?? "").trim().replace(/\s/g, "");
      const { data, error } = await authClient.twoFactor.verifyOtp({
        code,
        trustDevice: false,
      });
      if (error) throw new Error(messageErreurSecondFacteur(error));
      if (!data) throw new Error("Code refusé.");
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
            : "Code refusé.",
      );
    } finally {
      setChargement(false);
    }
  }

  if (!envoye) {
    return (
      <FieldGroup>
        <Field>
          <FieldDescription>
            Recevez un code à 6 chiffres par email, valable 5 minutes.
          </FieldDescription>
        </Field>
        {erreur ? (
          <p role="alert" className="text-xs text-destructive">
            {erreur}
          </p>
        ) : null}
        <Field>
          <Button
            type="button"
            size="lg"
            className="w-full font-bold"
            disabled={chargement}
            onClick={envoyerCode}
          >
            {chargement ? "Envoi…" : "Envoyer le code par email"}
          </Button>
        </Field>
      </FieldGroup>
    );
  }

  return (
    <form action={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="code-email">Code reçu par email</FieldLabel>
          <Input
            id="code-email"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 chiffres"
            minLength={6}
            maxLength={8}
            required
          />
          <FieldDescription>
            Saisissez le code reçu. Valable 5 minutes.
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
        <Field>
          <p className="text-xs text-muted-foreground">
            Rien reçu ?{" "}
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={envoyerCode}
              disabled={chargement}
            >
              Renvoyer le code
            </button>
            .
          </p>
        </Field>
      </FieldGroup>
    </form>
  );
}
