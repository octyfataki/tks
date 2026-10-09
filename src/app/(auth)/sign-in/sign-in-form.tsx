"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { demanderDestination } from "@/lib/destination-connexion";
import { MESSAGE_RESEAU, messageErreurConnexion } from "@/lib/erreurs-auth";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { toast } from "@/components/ui/toast";

// S1 : connexion unique email + mot de passe pour tous — client comme staff.
// Sans second facteur admin -> refus : Better Auth répond `twoFactorRedirect`,
// on envoie vers /verify-2fa. Pas d'écran d'attente : le bouton porte l'état
// (« Connexion… », désactivé) pendant l'appel.
// Après connexion, la destination n'est pas devinée : le serveur relit
// comptes_staff et comptes_clients et renvoie /admin, /agent, /clients ou
// /pending (compte client en attente ou refusé, qui reste connecté).
// Tout le feedback (succès, refus, 2FA) passe par les toasts : pas de
// message inline sous les champs.
export function SignInForm() {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);

  async function versSonEspace() {
    const { destination, code } = await demanderDestination();
    if (code === "REVOQUE" || code === "SUSPENDU") {
      // Le compte existe mais n'a plus le droit de rien faire : on ferme la
      // session ouverte à l'instant plutôt que de la laisser traîner.
      await authClient.signOut().catch(() => undefined);
      toast.add({
        type: "error",
        title: code === "SUSPENDU" ? "Compte suspendu" : "Compte révoqué",
        description:
          code === "SUSPENDU"
            ? "Accès gelé temporairement. Contactez l'administrateur."
            : "Contactez l'administrateur.",
      });
      return;
    }
    if (code === "EN_ATTENTE" || code === "REFUSE") {
      // Compte client non validé : il reste connecté et voit son état
      // avancer sur /pending — sans se réinscrire (S1-01, S1-03).
      toast.add({
        type: "info",
        title:
          code === "REFUSE" ? "Compte refusé" : "Compte en attente",
        description:
          code === "REFUSE"
            ? "Lisez le motif et corrigez votre demande."
            : "Votre demande attend sa validation.",
      });
      router.push(destination);
      return;
    }
    if (code === "INCONNU") {
      toast.add({
        type: "error",
        title: "Session introuvable",
        description: "Réessayez.",
      });
      return;
    }
    toast.add({ type: "success", title: "Connexion réussie" });
    router.push(destination);
  }

  async function onSubmit(form: FormData) {
    setChargement(true);
    try {
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");
      const { data, error } = await authClient.signIn.email(
        { email, password },
        {
          onSuccess: async (ctx) => {
            if (
              ctx.data &&
              typeof ctx.data === "object" &&
              "twoFactorRedirect" in ctx.data &&
              (ctx.data as { twoFactorRedirect?: boolean }).twoFactorRedirect
            ) {
              toast.add({
                type: "info",
                title: "Vérification en deux étapes",
                description: "Saisissez le code de votre application.",
              });
              router.push("/verify-2fa");
            } else {
              await versSonEspace();
            }
          },
        },
      );
      if (error) throw new Error(messageErreurConnexion(error));
      if (!data) await versSonEspace();
    } catch (e) {
      toast.add({
        type: "error",
        title: "Connexion refusée",
        description:
          e instanceof TypeError
            ? MESSAGE_RESEAU
            : e instanceof Error
              ? e.message
              : "connexion refusée",
      });
    } finally {
      setChargement(false);
    }
  }

  return (
    <form action={onSubmit}>
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
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Field>
          <Button
            type="submit"
            size="lg"
            className="w-full font-bold"
            disabled={chargement}
          >
            {chargement ? "Connexion…" : "Se connecter"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
