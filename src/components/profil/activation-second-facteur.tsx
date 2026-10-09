"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { CheckIcon, CopyIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react";
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

type Etape = "appareil" | "verification" | "courriel" | "codes";

/**
 * Active le second facteur TOTP du compte connecté (administrateurs
 * uniquement) : nom d'appareil + mot de passe, QR à scanner, code à
 * 6 chiffres, puis codes de secours à conserver. Le secret ne s'affiche
 * jamais : seul le QR temporaire permet l'enrôlement, et la traçabilité
 * (appareil nommé) est enregistrée côté serveur après vérification.
 */
export function ActivationSecondFacteur({ email }: { email?: string | null }) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [etape, setEtape] = React.useState<Etape>("appareil");
  const [nomAppareil, setNomAppareil] = React.useState("");
  const [totpUri, setTotpUri] = React.useState<string | null>(null);
  const [codesSecours, setCodesSecours] = React.useState<string[]>([]);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [chargement, setChargement] = React.useState(false);
  const [copie, setCopie] = React.useState(false);
  const [methode, setMethode] = React.useState<"totp" | "email">("totp");

  function ouvrir() {
    setEtape("appareil");
    setMethode("totp");
    setNomAppareil("");
    setTotpUri(null);
    setCodesSecours([]);
    setErreur(null);
    setCopie(false);
    setOuvert(true);
  }

  function fermer() {
    setOuvert(false);
    setEtape("appareil");
    setMethode("totp");
    setNomAppareil("");
    setTotpUri(null);
    setCodesSecours([]);
    setErreur(null);
    setCopie(false);
  }

  async function demanderQr(form: FormData) {
    const motDePasse = String(form.get("motDePasse") ?? "");
    const nom = `Appareil du ${new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
    if (!motDePasse) {
      setErreur("Votre mot de passe est exigé pour activer le second facteur.");
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      if (methode === "email") {
        const { error: erreurActivation } = await authClient.twoFactor.enable({
          password: motDePasse,
          method: "otp",
        });
        if (erreurActivation) throw new Error(messageErreurSecondFacteur(erreurActivation));
        const { error: erreurEnvoi } = await authClient.twoFactor.sendOtp({ trustDevice: false });
        if (erreurEnvoi) throw new Error(messageErreurSecondFacteur(erreurEnvoi));
        setNomAppareil("Code par email");
        setTotpUri(null);
        setCodesSecours([]);
        setEtape("courriel");
        return;
      }
      const { data, error } = await authClient.twoFactor.enable({
        password: motDePasse,
      });
      if (error) throw new Error(messageErreurSecondFacteur(error));
      const uri = (data as { totpURI?: string } | null)?.totpURI;
      const codes = (data as { backupCodes?: string[] } | null)?.backupCodes ?? [];
      if (!uri) throw new Error("Activation refusée.");
      setNomAppareil(nom);
      setTotpUri(uri);
      setCodesSecours(codes);
      setEtape("verification");
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

  async function verifierCode(form: FormData) {
    const code = String(form.get("code") ?? "").trim().replace(/\s/g, "");
    if (!/^\d{6,8}$/.test(code)) {
      setErreur("Saisissez le code à 6 chiffres de votre application.");
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: false,
      });
      if (error) throw new Error(messageErreurSecondFacteur(error));
      if (!data) throw new Error("Code refusé.");
      const confirmation = await confirmerSecondFacteurAction(nomAppareil);
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

  async function verifierCodeCourriel(form: FormData) {
    const code = String(form.get("code") ?? "").trim().replace(/\s/g, "");
    if (!/^\d{6,8}$/.test(code)) {
      setErreur("Saisissez le code à 6 chiffres reçu par email.");
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
      const confirmation = await confirmerSecondFacteurAction("Code par email");
      if (!confirmation.ok) throw new Error(confirmation.erreur);
      setCodesSecours([]);
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

  async function copierCodes() {
    try {
      await navigator.clipboard.writeText(codesSecours.join("\n"));
      setCopie(true);
    } catch {
      setCopie(false);
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
                ? "Étape 1/3 : choisissez la méthode, puis confirmez le mot de passe."
                : etape === "verification"
                  ? "Étape 2/3 : scannez puis vérifiez."
                  : etape === "courriel"
                    ? "Étape 2/3 : saisissez le code reçu par email."
                    : codesSecours.length > 0
                      ? "Étape 3/3 : conservez vos codes de secours."
                      : "Second facteur actif."}
            </DialogDescription>
          </DialogHeader>

          {etape === "appareil" ? (
            <form
              action={demanderQr}
              className="flex flex-col gap-3"
              aria-label="Nommer l'appareil"
            >
              <div role="group" aria-label="Méthode du second facteur" className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={methode === "totp"}
                  onClick={() => setMethode("totp")}
                  className={methode === "totp" ? "rounded-lg border-2 border-primary bg-primary/5 px-3 py-2.5 text-left" : "rounded-lg border px-3 py-2.5 text-left hover:bg-muted/50"}
                >
                  <span className="block text-xs font-medium">Application</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">Recommandé, hors-ligne</span>
                </button>
                <button
                  type="button"
                  aria-pressed={methode === "email"}
                  onClick={() => setMethode("email")}
                  className={methode === "email" ? "rounded-lg border-2 border-primary bg-primary/5 px-3 py-2.5 text-left" : "rounded-lg border px-3 py-2.5 text-left hover:bg-muted/50"}
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
                  Prouve que c&apos;est bien vous avant de générer le code. Il n&apos;est ni stocké ni affiché.
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
                      Activation…
                    </>
                  ) : (
                    "Voir le code à scanner"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}

          {etape === "verification" && totpUri ? (
            <form
              action={verifierCode}
              className="flex flex-col gap-3"
              aria-label="Vérifier le code"
            >
              <p className="text-xs leading-relaxed text-muted-foreground">
                Scannez ce code avec votre application d&apos;authentification,
                puis saisissez le code à 6 chiffres affiché (Google Authenticator, Authy…), jamais par SMS.
              </p>
              <div className="mx-auto w-fit rounded-lg border bg-white p-3">
                <QRCode value={totpUri} size={180} aria-label="Code à scanner" />
              </div>
              <div>
                <label htmlFor="2fa-code" className="mb-1.5 block text-xs font-medium">
                  Code de l&apos;application
                </label>
                <Input
                  id="2fa-code"
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
                    "Vérifier et activer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}

          {etape === "courriel" ? (
            <form
              action={verifierCodeCourriel}
              className="flex flex-col gap-3"
              aria-label="Vérifier le code reçu"
            >
              <p className="text-xs leading-relaxed text-muted-foreground">
                Un code à 6 chiffres vient d&apos;être envoyé{email ? ` à ${email}` : ""} — valable 5 minutes.
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
            <div className="flex flex-col gap-3" aria-label="Codes de secours">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Second facteur actif ({nomAppareil}). Conservez ces codes de secours : chacun
                n&apos;est utilisable qu&apos;une fois, en cas de perte de
                l&apos;appareil.
              </p>
              {codesSecours.length > 0 ? (
                <ul className="grid grid-cols-2 gap-1.5">
                  {codesSecours.map((code) => (
                    <li key={code}>
                      <code className="block rounded-md border bg-muted/40 px-2 py-1.5 text-center text-xs tabular-nums">
                        {code}
                      </code>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  À chaque connexion, un code vous sera envoyé par email. En cas de perte
                  d&apos;accès à la boîte, contactez le distributeur.
                </p>
              )}
              {erreur ? (
                <p role="alert" className="text-xs text-destructive">
                  {erreur}
                </p>
              ) : null}
              <DialogFooter className="sm:justify-between">
                {codesSecours.length > 0 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={copierCodes}>
                    {copie ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
                    {copie ? "Copié" : "Copier les codes"}
                  </Button>
                ) : (
                  <span aria-hidden />
                )}
                <Button type="button" size="sm" onClick={terminer}>
                  {codesSecours.length > 0 ? "J'ai conservé mes codes" : "Terminer"}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
