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
  evaluatePasswordStrength,
  validatePasswordChange,
  type PasswordStrengthLevel,
} from "./password-validation";

const STRENGTH_COLORS: Record<PasswordStrengthLevel, string> = {
  0: "bg-destructive",
  1: "bg-orange-500",
  2: "bg-amber-500",
  3: "bg-lime-500",
  4: "bg-emerald-500",
};

const STRENGTH_TEXT_COLORS: Record<PasswordStrengthLevel, string> = {
  0: "text-destructive",
  1: "text-orange-600 dark:text-orange-400",
  2: "text-amber-600 dark:text-amber-400",
  3: "text-lime-600 dark:text-lime-400",
  4: "text-emerald-600 dark:text-emerald-400",
};

export function PasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const isOffline =
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? !navigator.onLine
      : false;

  const strength = evaluatePasswordStrength(newPassword);
  const matchStatus =
    confirmation.length === 0
      ? null
      : newPassword === confirmation
        ? "ok"
        : "ko";

  async function handleSubmit(form: FormData) {
    setError(null);
    const validationError = validatePasswordChange({
      currentPassword: String(form.get("currentPassword") ?? ""),
      newPassword: String(form.get("newPassword") ?? ""),
      confirmation: String(form.get("confirmation") ?? ""),
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: String(form.get("currentPassword") ?? ""),
        newPassword: String(form.get("newPassword") ?? ""),
        revokeOtherSessions: true,
      });
      if (error) throw new Error(error.message ?? "changement refusé");
      toast.add({
        type: "success",
        title: "Mot de passe changé",
        description: "Les autres sessions ont été fermées.",
      });
      setNewPassword("");
      setConfirmation("");
      const formElement = document.getElementById(
        "agent-password-form",
      ) as HTMLFormElement | null;
      formElement?.reset();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "changement refusé, réessayez";
      setError(message);
      toast.add({
        type: "error",
        title: "Échec du changement",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form id="agent-password-form" action={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="agent-password-current">Mot de passe actuel</FieldLabel>
          <PasswordInput
            id="agent-password-current"
            name="currentPassword"
            autoComplete="current-password"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="agent-password-new">
            Nouveau mot de passe
          </FieldLabel>
          <PasswordInput
            id="agent-password-new"
            name="newPassword"
            autoComplete="new-password"
            minLength={8}
            required
            value={newPassword}
            onChange={setNewPassword}
          />
          {newPassword.length > 0 ? (
            <div className="mt-2 flex items-center gap-2.5">
              <div
                role="img"
                aria-label={`Force du mot de passe : ${strength.label}`}
                className="flex flex-1 gap-1"
              >
                {[1, 2, 3, 4].map((segment) => (
                  <span
                    key={segment}
                    aria-hidden="true"
                    className={
                      segment <= Math.max(strength.level, 1)
                        ? `h-1 flex-1 rounded-full ${STRENGTH_COLORS[strength.level]}`
                        : "h-1 flex-1 rounded-full bg-muted"
                    }
                  />
                ))}
              </div>
              <span
                className={`shrink-0 text-xs font-semibold ${STRENGTH_TEXT_COLORS[strength.level]}`}
              >
                {strength.label}
              </span>
            </div>
          ) : (
            <FieldDescription>
              Au moins 8 caractères. Les autres sessions seront fermées.
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="agent-password-confirmation">
            Confirmer le nouveau mot de passe
          </FieldLabel>
          <PasswordInput
            id="agent-password-confirmation"
            name="confirmation"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmation}
            onChange={setConfirmation}
          />
          {matchStatus === "ok" ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckIcon className="size-3.5" strokeWidth={3} />
              Les mots de passe correspondent.
            </p>
          ) : matchStatus === "ko" ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
              <XIcon className="size-3.5" strokeWidth={3} />
              La confirmation ne correspond pas encore.
            </p>
          ) : null}
        </Field>
        {isOffline ? (
          <p role="alert" className="text-xs text-destructive">
            Sans réseau : le changement de mot de passe attendra le retour du
            réseau et la file durable de S8.
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="rounded-md bg-destructive/8 px-3 py-2 text-xs leading-relaxed text-destructive"
          >
            {error}
          </p>
        ) : null}
        <Field>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting || isOffline}
          >
            <KeyRoundIcon />
            {isSubmitting ? "Changement…" : "Changer mon mot de passe"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}