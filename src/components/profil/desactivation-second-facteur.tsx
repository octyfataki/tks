"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, ShieldOffIcon } from "lucide-react";
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
import { desactiverSecondFacteurAction } from "@/app/admin/profil/actions";

type Etape = "confirmation" | "termine";

/**
 * Désactive le second facteur OTP du compte connecté (tout compte VALIDE,
 * staff comme client, depuis sa page profil — issue #5) : mot de passe exigé
 * et vérifié par better-auth (`twoFactor.disable`), puis traçabilité marquée
 * inactive côté serveur (aucune ligne supprimée). Miroir de
 * l'activation : prouve que c'est bien le titulaire avant de retirer une
 * protection. Après désactivation, la connexion suivante se fait au mot de
 * passe seul, sans code.
 */
export function DesactivationSecondFacteur() {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [etape, setEtape] = React.useState<Etape>("confirmation");
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [chargement, setChargement] = React.useState(false);

  function ouvrir() {
    setEtape("confirmation");
    setErreur(null);
    setOuvert(true);
  }

  function fermer() {
    setOuvert(false);
    setEtape("confirmation");
    setErreur(null);
  }

  async function desactiver(form: FormData) {
    const motDePasse = String(form.get("motDePasse") ?? "");
    if (!motDePasse) {
      setErreur("Votre mot de passe est exigé pour désactiver le second facteur.");
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      const { error: erreurDesactivation } = await authClient.twoFactor.disable({
        password: motDePasse,
      });
      if (erreurDesactivation) throw new Error(messageErreurSecondFacteur(erreurDesactivation));
      const confirmation = await desactiverSecondFacteurAction();
      if (!confirmation.ok) throw new Error(confirmation.erreur);
      setEtape("termine");
    } catch (e) {
      setErreur(
        e instanceof TypeError
          ? MESSAGE_RESEAU
          : e instanceof Error
            ? e.message
            : "Désactivation refusée.",
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
      <Button type="button" variant="outline" size="sm" onClick={ouvrir}>
        <ShieldOffIcon aria-hidden />
        Désactiver le second facteur
      </Button>

      <Dialog open={ouvert} onOpenChange={(v) => (v ? setOuvert(true) : fermer())}>
        <DialogContent aria-label="Désactiver le second facteur">
          <DialogHeader>
            <DialogTitle className="text-base">Désactiver le second facteur</DialogTitle>
            <DialogDescription>
              {etape === "confirmation"
                ? "La connexion suivante se fera au mot de passe seul, sans code."
                : "Second facteur désactivé."}
            </DialogDescription>
          </DialogHeader>

          {etape === "confirmation" ? (
            <form
              action={desactiver}
              className="flex flex-col gap-3"
              aria-label="Confirmer la désactivation"
            >
              <div>
                <label htmlFor="2fa-desactiver-motdepasse" className="mb-1.5 block text-xs font-medium">
                  Confirmez votre mot de passe
                </label>
                <Input
                  id="2fa-desactiver-motdepasse"
                  name="motDePasse"
                  type="password"
                  autoComplete="current-password"
                  required
                />
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Prouve que c&apos;est bien vous avant de retirer cette protection. Il n&apos;est ni stocké ni affiché.
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
                <Button type="submit" size="sm" variant="destructive" disabled={chargement}>
                  {chargement ? (
                    <>
                      <Loader2Icon className="animate-spin" aria-hidden />
                      Désactivation…
                    </>
                  ) : (
                    "Désactiver"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}

          {etape === "termine" ? (
            <div className="flex flex-col gap-3" aria-label="Second facteur désactivé">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Second facteur désactivé. À la prochaine connexion, seul votre mot de passe sera
                demandé. Vous pourrez le réactiver à tout moment depuis cette page.
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
