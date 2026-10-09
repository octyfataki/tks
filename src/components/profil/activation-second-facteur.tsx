"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { MESSAGE_RESEAU, messageErreurSecondFacteur } from "@/lib/erreurs-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { confirmerSecondFacteurAction } from "@/app/admin/profil/actions";

type Etape = "appareil" | "sms" | "courriel" | "codes";
type Canal = "sms" | "email";

/**
 * Active le second facteur OTP du compte connecté (administrateurs
 * uniquement) : mot de passe, choix du canal (SMS prioritaire, email en
 * repli), code à 6 chiffres, puis confirmation. Le même code part sur les
 * deux canaux (voir sendOTP dans src/lib/auth.ts) ; l'utilisateur saisit
 * celui qu'il reçoit. La traçabilité (canal nommé) est enregistrée côté
 * serveur après vérification. Sans TOTP : aucune application à installer,
 * aucun QR à scanner.
 */
export function ActivationSecondFacteur({
  email,
  telephone,
}: {
  email?: string | null;
  telephone?: string | null;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [etape, setEtape] = React.useState<Etape>("appareil");
  const [canal, setCanal] = React.useState<Canal>("sms");
  const [nomCanal, setNomCanal] = React.useState("");
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [chargement, setChargement] = React.useState(false);

  function ouvrir() {
    setEtape("appareil");
    setCanal("sms");
    setNomCanal("");
    setErreur(null);
    setOuvert(true);
  }

  function fermer() {
    setOuvert(false);
    setEtape("appareil");
    setCanal("sms");
    setNomCanal("");
    setErreur(null);
  }

  function telephoneMasque(): string {
    const numero = (telephone ?? "").trim();
    if (numero.length < 4) return numero;
    return `•••• ${numero.slice(-4)}`;
  }

  async function demanderCode(form: FormData) {
    const motDePasse = String(form.get("motDePasse") ?? "");
    if (!motDePasse) {
      setErreur("Votre mot de passe est exigé pour activer le second facteur.");
      return;
    }
    if (canal === "sms" && !(telephone ?? "").trim()) {
      setErreur(
        "Aucun numéro de contact sur votre compte : renseignez-le d'abord via le formulaire Coordonnées, puis revenez ici.",
      );
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      const { error: erreurActivation } = await authClient.twoFactor.enable({
        password: motDePasse,
        method: "otp",
      });
      if (erreurActivation) throw new Error(messageErreurSecondFacteur(erreurActivation));
      const { error: erreurEnvoi } = await authClient.twoFactor.sendOtp({ trustDevice: false });
      if (erreurEnvoi) throw new Error(messageErreurSecondFacteur(erreurEnvoi));
      setNomCanal(canal === "sms" ? "Code par SMS" : "Code par email");
      setEtape(canal === "sms" ? "sms" : "courriel");
    } catch (e) {
      setErreur(
        e instanceof TypeError
          ? MESSAGE_RESEAU
          : e instanceof Error
            ? e.message
            : "Activation refusée.",
      );
    } finally {
      setChargement(false);
    }
  }

  async function verifierCode(form: FormData, attendu: string) {
    const code = String(form.get("code") ?? "").trim().replace(/\s/g, "");
    if (!/^\d{6,8}$/.test(code)) {
      setErreur(`Saisissez le code à 6 chiffres reçu ${attendu}.`);
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      const { data, error } = await authClient.twoFactor.verifyOtp({
        code,
        trustDevice: false,
      });
      if (error) throw new Error(messageErreurSecondFacteur(error));
      if (!data) throw new Error("Code refusé.");
      const confirmation = await confirmerSecondFacteurAction(nomCanal);
      if (!confirmation.ok) throw new Error(confirmation.erreur);
      setEtape("codes");
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

  function terminer() {
    fermer();
    router.refresh();
  }

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={ouvrir} className="border-primary/60 text-primary hover:bg-primary/5 hover:text-primary">
        <ShieldCheckIcon aria-hidden />
        Activer le second facteur
      </Button>

      <Dialog open={ouvert} onOpenChange={(v) => (v ? setOuvert(true) : fermer())}>
        <DialogContent aria-label="Activer le second facteur">
          <DialogHeader>
            <DialogTitle className="text-base">Activer le second facteur</DialogTitle>
            <DialogDescription>
              {etape === "appareil"
                ? "Étape 1/2 : choisissez le canal, puis confirmez le mot de passe."
                : etape === "codes"
                  ? "Second facteur actif."
                  : "Étape 2/2 : saisissez le code reçu."}
            </DialogDescription>
          </DialogHeader>

          {etape === "appareil" ? (
            <form
              action={demanderCode}
              className="flex flex-col gap-3"
              aria-label="Choisir le canal"
            >
              <div role="group" aria-label="Canal du second facteur" className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={canal === "sms"}
                  onClick={() => setCanal("sms")}
                  className={canal === "sms" ? "rounded-lg border-2 border-primary bg-primary/5 px-3 py-2.5 text-left" : "rounded-lg border px-3 py-2.5 text-left hover:bg-muted/50"}
                >
                  <span className="block text-xs font-medium">SMS</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {telephone?.trim() ? telephoneMasque() : "Recommandé"}
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={canal === "email"}
                  onClick={() => setCanal("email")}
                  className={canal === "email" ? "rounded-lg border-2 border-primary bg-primary/5 px-3 py-2.5 text-left" : "rounded-lg border px-3 py-2.5 text-left hover:bg-muted/50"}
                >
                  <span className="block text-xs font-medium">Email</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">Code reçu par email</span>
                </button>
              </div>
              <div>
                <label htmlFor="2fa-motdepasse" className="mb-1.5 block text-xs font-medium">
                  Confirmez votre mot de passe
                </label>
                <Input
                  id="2fa-motdepasse"
                  name="motDePasse"
                  type="password"
                  autoComplete="current-password"
                  required
                />
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Prouve que c&apos;est bien vous avant d&apos;envoyer le code. Il n&apos;est ni stocké ni affiché.
                </p>
              </div>
              {erreur ? (
                <p role="alert" className="text-xs text-destructive">
                  {erreur}
                </p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={fermer}>
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={chargement}>
                  {chargement ? (
                    <>
                      <Loader2Icon className="animate-spin" aria-hidden />
                      Envoi…
                    </>
                  ) : (
                    "Recevoir le code"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}

          {etape === "sms" ? (
            <form
              action={(form) => verifierCode(form, "par SMS")}
              className="flex flex-col gap-3"
              aria-label="Vérifier le code reçu"
            >
              <p className="text-xs leading-relaxed text-muted-foreground">
                Un code à 6 chiffres vient d&apos;être envoyé
                {telephone?.trim() ? ` au ${telephoneMasque()}` : ""} (et par email en repli) — valable 5 minutes.
              </p>
              <div>
                <label htmlFor="2fa-code-sms" className="mb-1.5 block text-xs font-medium">
                  Code reçu par SMS
                </label>
                <Input
                  id="2fa-code-sms"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6 chiffres"
                  minLength={6}
                  maxLength={8}
                  required
                />
              </div>
              {erreur ? (
                <p role="alert" className="text-xs text-destructive">
                  {erreur}
                </p>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEtape("appareil")}
                >
                  Retour
                </Button>
                <Button type="submit" size="sm" disabled={chargement}>
                  {chargement ? (
                    <>
                      <Loader2Icon className="animate-spin" aria-hidden />
                      Vérification…
                    </>
                  ) : (
                    "Activer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}

          {etape === "courriel" ? (
            <form
              action={(form) => verifierCode(form, "par email")}
              className="flex flex-col gap-3"
              aria-label="Vérifier le code reçu"
            >
              <p className="text-xs leading-relaxed text-muted-foreground">
                Un code à 6 chiffres vient d&apos;être envoyé{email ? ` à ${email}` : ""} (et par SMS en redondance) — valable 5 minutes.
              </p>
              <div>
                <label htmlFor="2fa-code-email" className="mb-1.5 block text-xs font-medium">
                  Code reçu par email
                </label>
                <Input
                  id="2fa-code-email"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6 chiffres"
                  minLength={6}
                  maxLength={8}
                  required
                />
              </div>
              {erreur ? (
                <p role="alert" className="text-xs text-destructive">
                  {erreur}
                </p>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEtape("appareil")}
                >
                  Retour
                </Button>
                <Button type="submit" size="sm" disabled={chargement}>
                  {chargement ? (
                    <>
                      <Loader2Icon className="animate-spin" aria-hidden />
                      Vérification…
                    </>
                  ) : (
                    "Activer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}

          {etape === "codes" ? (
            <div className="flex flex-col gap-3" aria-label="Second facteur actif">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Second facteur actif ({nomCanal}). À chaque connexion, un code vous sera envoyé
                par SMS et par email. En cas de perte d&apos;accès aux deux canaux, contactez
                le distributeur.
              </p>
              {erreur ? (
                <p role="alert" className="text-xs text-destructive">
                  {erreur}
                </p>
              ) : null}
              <DialogFooter>
                <Button type="button" size="sm" onClick={terminer}>
                  Terminer
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
