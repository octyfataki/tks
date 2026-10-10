"use client";

import { useState } from "react";
import { CheckIcon, KeyRoundIcon, XIcon } from "lucide-react";
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
import {
  evaluerForceMotDePasse,
  validerChangementMotDePasse,
  type NiveauForceMotDePasse,
} from "./mot-de-passe-validation";

const COULEURS_FORCE: Record<NiveauForceMotDePasse, string> = {
  0: "bg-destructive",
  1: "bg-orange-500",
  2: "bg-amber-500",
  3: "bg-lime-500",
  4: "bg-emerald-500",
};

const TEXTE_FORCE: Record<NiveauForceMotDePasse, string> = {
  0: "text-destructive",
  1: "text-orange-600 dark:text-orange-400",
  2: "text-amber-600 dark:text-amber-400",
  3: "text-lime-600 dark:text-lime-400",
  4: "text-emerald-600 dark:text-emerald-400",
};

/**
 * Changement de mot de passe de l'agent de service.
 *
 * better-auth exige le mot de passe actuel et révoque les autres sessions
 * (`revokeOtherSessions`) : sur un téléphone partagé au comptoir, changer
 * son mot de passe coupe les sessions ouvertes ailleurs.
 *
 * Retour en direct : jauge de force sous le nouveau mot de passe et
 * contrôle de correspondance sous la confirmation — la validation
 * bloquante reste celle de `validerChangementMotDePasse` à l'envoi.
 *
 * Limite honnête : l'opération exige le réseau. Hors-ligne, elle attendra
 * la file durable de S8 — le formulaire le dit et se désactive sans réseau.
 */
export function FormulaireMotDePasse() {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const horsLigne =
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? !navigator.onLine
      : false;

  const force = evaluerForceMotDePasse(nouveau);
  const correspondance =
    confirmation.length === 0
      ? null
      : nouveau === confirmation
        ? "ok"
        : "ko";

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
      setNouveau("");
      setConfirmation("");
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
            value={nouveau}
            onChange={setNouveau}
          />
          {nouveau.length > 0 ? (
            <div className="mt-2 flex items-center gap-2.5">
              <div
                role="img"
                aria-label={`Force du mot de passe : ${force.etiquette}`}
                className="flex flex-1 gap-1"
              >
                {[1, 2, 3, 4].map((segment) => (
                  <span
                    key={segment}
                    aria-hidden="true"
                    className={
                      segment <= Math.max(force.niveau, 1)
                        ? `h-1 flex-1 rounded-full ${COULEURS_FORCE[force.niveau]}`
                        : "h-1 flex-1 rounded-full bg-muted"
                    }
                  />
                ))}
              </div>
              <span
                className={`shrink-0 text-xs font-semibold ${TEXTE_FORCE[force.niveau]}`}
              >
                {force.etiquette}
              </span>
            </div>
          ) : (
            <FieldDescription>
              Au moins 8 caractères. Les autres sessions seront fermées.
            </FieldDescription>
          )}
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
            value={confirmation}
            onChange={setConfirmation}
          />
          {correspondance === "ok" ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckIcon className="size-3.5" strokeWidth={3} />
              Les mots de passe correspondent.
            </p>
          ) : correspondance === "ko" ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
              <XIcon className="size-3.5" strokeWidth={3} />
              La confirmation ne correspond pas encore.
            </p>
          ) : null}
        </Field>
        {horsLigne ? (
          <p role="alert" className="text-xs text-destructive">
            Sans réseau : le changement de mot de passe attendra le retour du
            réseau et la file durable de S8.
          </p>
        ) : null}
        {erreur ? (
          <p
            role="alert"
            className="rounded-md bg-destructive/8 px-3 py-2 text-xs leading-relaxed text-destructive"
          >
            {erreur}
          </p>
        ) : null}
        <Field>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={enCours || horsLigne}
          >
            <KeyRoundIcon />
            {enCours ? "Changement…" : "Changer mon mot de passe"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
