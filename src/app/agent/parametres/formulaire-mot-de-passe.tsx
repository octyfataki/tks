"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { validerChangementMotDePasse } from "./mot-de-passe-validation";

/**
 * Changement de mot de passe de l'agent de service.
 *
 * better-auth exige le mot de passe actuel et révoque les autres sessions
 * (`revokeOtherSessions`) : sur un téléphone partagé au comptoir, changer
 * son mot de passe coupe les sessions ouvertes ailleurs.
 *
 * Limite honnête : l'opération exige le réseau. Hors-ligne, elle attendra
 * la file durable de S8 — le formulaire le dit et se désactive sans réseau.
 */
export function FormulaireMotDePasse() {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const horsLigne =
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? !navigator.onLine
      : false;

  async function onSubmit(form: FormData) {
    setErreur(null);
    const resultat = validerChangementMotDePasse({
      actuel: String(form.get("actuel") ?? ""),
      nouveau: String(form.get("nouveau") ?? ""),
      confirmation: String(form.get("confirmation") ?? ""),
    });
    if (resultat) {
      setErreur(resultat);
      return;
    }
    setEnCours(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: String(form.get("actuel") ?? ""),
        newPassword: String(form.get("nouveau") ?? ""),
        revokeOtherSessions: true,
      });
      if (error) throw new Error(error.message ?? "changement refusé");
      toast.add({
        type: "success",
        title: "Mot de passe changé",
        description: "Les autres sessions ont été fermées.",
      });
      const formulaire = document.getElementById(
        "agent-mot-de-passe",
      ) as HTMLFormElement | null;
      formulaire?.reset();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "changement refusé, réessayez";
      setErreur(message);
      toast.add({
        type: "error",
        title: "Échec du changement",
        description: message,
      });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form id="agent-mot-de-passe" action={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="agent-mdp-actuel">Mot de passe actuel</FieldLabel>
          <PasswordInput
            id="agent-mdp-actuel"
            name="actuel"
            autoComplete="current-password"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="agent-mdp-nouveau">
            Nouveau mot de passe
          </FieldLabel>
          <PasswordInput
            id="agent-mdp-nouveau"
            name="nouveau"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <FieldDescription>
            Au moins 8 caractères. Les autres sessions seront fermées.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="agent-mdp-confirmation">
            Confirmer le nouveau mot de passe
          </FieldLabel>
          <PasswordInput
            id="agent-mdp-confirmation"
            name="confirmation"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        {horsLigne ? (
          <p role="alert" className="text-xs text-destructive">
            Sans réseau : le changement de mot de passe attendra le retour du
            réseau et la file durable de S8.
          </p>
        ) : null}
        {erreur ? (
          <p role="alert" className="text-xs text-destructive">
            {erreur}
          </p>
        ) : null}
        <Field>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={enCours || horsLigne}
          >
            {enCours ? "Changement…" : "Changer mon mot de passe"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
