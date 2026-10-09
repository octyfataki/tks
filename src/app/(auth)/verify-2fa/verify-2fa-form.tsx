"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Methode = "sms" | "email";

// S1-02 : second facteur obligatoire pour les deux administrateurs, exigé à
// chaque nouvelle session. Sans code valide : pas de session, pas d'accès
// (étape bloquante). `trustDevice: false` — jamais mémorisé, chaque session
// re-vérifie.
// Second facteur = OTP à usage unique (6 chiffres, 5 minutes), envoyé sur deux
// canaux redondants : SMS (prioritaire, onglet par défaut) et email. Le même
// code part sur les deux ; l'utilisateur saisit celui qu'il reçoit.
// ÉCART ASSUMÉ à S1-spec et ADR-0006 §4, voir src/lib/auth.ts.
// Délai anti-renvoi : le serveur limite déjà à 3 envois/minute, mais sans
// retour visible l'utilisateur martèle le bouton. Le minuteur local rend
// l'attente explicite ; la garde serveur reste l'autorité.
const DELAI_RENVOI_SECONDES = 60;

export function Verify2faForm() {
  const router = useRouter();
  const [methode, setMethode] = useState<Methode>("sms");
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [attente, setAttente] = useState(0);
  const [dejaEnvoye, setDejaEnvoye] = useState(false);

  useEffect(() => {
    if (attente <= 0) return;
    const minuteur = setInterval(() => {
      setAttente((restant) => Math.max(0, restant - 1));
    }, 1000);
    return () => clearInterval(minuteur);
  }, [attente]);

  async function ouvrirSession() {
    // Session ouverte : le serveur dit où atterrir (le second facteur
    // n'exige que les administrateurs, mais la décision reste la même).
    const suite = await demanderDestination();
    if (suite.code !== "OK") {
      setErreur("Session introuvable : réessayez.");
      return;
    }
    router.push(suite.destination);
  }

  async function envoyerCode() {
    setErreur(null);
    setInfo(null);
    setEnvoi(true);
    try {
      const { error } = await authClient.twoFactor.sendOtp({
        trustDevice: false,
      });
      if (error) throw new Error(messageErreurSecondFacteur(error));
      setDejaEnvoye(true);
      setAttente(DELAI_RENVOI_SECONDES);
      setInfo("Code envoyé par SMS et par email. Saisissez celui que vous avez reçu.");
    } catch (e) {
      setErreur(
        e instanceof TypeError
          ? MESSAGE_RESEAU
          : e instanceof Error
            ? e.message
            : "envoi refusé",
      );
    } finally {
      setEnvoi(false);
    }
  }

  async function onSubmit(form: FormData) {
    setErreur(null);
    setInfo(null);
    setChargement(true);
    try {
      const code = String(form.get("code") ?? "").trim().replace(/\s/g, "");
      const { data, error } = await authClient.twoFactor.verifyOtp({
        code,
        trustDevice: false,
      });
      if (error) throw new Error(messageErreurSecondFacteur(error));
      if (!data) throw new Error("code refusé");
      await ouvrirSession();
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
    <div className="flex flex-col gap-4">
      <Tabs
        value={methode}
        onValueChange={(v) => {
          setMethode(v as Methode);
          setErreur(null);
          setInfo(null);
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>
      </Tabs>
      <form action={onSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="code">
              {methode === "email" ? "Code reçu par email" : "Code reçu par SMS"}
            </FieldLabel>
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
              {methode === "email"
                ? "Demandez un code, ouvrez votre boîte email et saisissez-le ici. Valable 5 minutes."
                : "Demandez un code, ouvrez vos SMS et saisissez-le ici. Valable 5 minutes."}
            </FieldDescription>
          </Field>
          <Field>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full font-bold"
              disabled={envoi || chargement || attente > 0}
              onClick={envoyerCode}
            >
              {envoi
                ? "Envoi…"
                : attente > 0
                  ? `Renvoyer dans ${attente} s`
                  : dejaEnvoye
                    ? "Renvoyer le code"
                    : "Recevoir le code"}
            </Button>
          </Field>
          {info ? (
            <p role="status" className="text-xs text-muted-foreground">
              {info}
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
              size="lg"
              className="w-full font-bold"
              disabled={chargement}
            >
              {chargement ? "Vérification…" : "Vérifier"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
