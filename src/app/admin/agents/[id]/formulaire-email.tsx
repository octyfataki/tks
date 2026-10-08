"use client";

import * as React from "react";
import { useActionState } from "react";
import { MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  modifierEmailAgentAction,
  type ResultatModificationCoordonneesAgent,
} from "./actions";

/**
 * Change l'email (identifiant de connexion) d'un agent de service.
 * L'email est la clé du compte : la saisie seule ne suffit pas, un
 * dialogue affiche ancien → nouveau et exige une confirmation
 * explicite. La garde réelle (unicité comprise) est côté serveur.
 */
export function FormulaireEmailAgent({
  id,
  emailInitial,
}: {
  id: string;
  emailInitial: string;
}) {
  const [resultat, action, enCours] = useActionState(
    modifierEmailAgentAction.bind(null, id),
    null as ResultatModificationCoordonneesAgent | null,
  );
  const [email, setEmail] = React.useState(emailInitial);
  const [confirme, setConfirme] = React.useState(false);
  const sale = email.trim().toLowerCase() !== emailInitial.trim().toLowerCase();

  React.useEffect(() => {
    if (resultat?.ok) setConfirme(false);
  }, [resultat]);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div>
        <label htmlFor="email-agent" className="mb-1.5 block text-xs font-medium">
          Adresse email (identifiant de connexion)
        </label>
        <div className="group relative">
          <MailIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            id="email-agent"
            name="email-agent"
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg pl-9"
          />
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        L&apos;agent se connectera avec la nouvelle adresse. L&apos;ancienne ne
        marchera plus.
      </p>
      {resultat && !resultat.ok ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {resultat.erreur}
        </p>
      ) : null}
      {resultat?.ok ? (
        <p role="status" className="text-xs font-medium text-green-700">
          {resultat.inchange ? "Aucun changement." : "Adresse enregistrée."}
        </p>
      ) : null}
      <div>
        <Button
          type="button"
          size="sm"
          disabled={enCours || !sale || !email.includes("@")}
          onClick={() => {
            setConfirme(true);
          }}
        >
          Changer l&apos;adresse
        </Button>
      </div>

      <Dialog
        open={confirme}
        onOpenChange={(nouveau) => {
          if (!enCours) setConfirme(nouveau);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer l&apos;adresse de connexion ?</DialogTitle>
            <DialogDescription>
              <span className="block font-mono text-[11px] break-all select-all">
                {emailInitial}
              </span>
              <span aria-hidden className="block">↓</span>
              <span className="block font-mono text-[11px] break-all select-all">
                {email.trim()}
              </span>
              <span className="mt-2 block">
                Vérifiez chaque lettre : une coquille bloque l&apos;agent hors
                de son compte.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={enCours} />}
            >
              Annuler
            </DialogClose>
            <form action={action}>
              <input type="hidden" name="email" value={email.trim()} />
              <input type="hidden" name="confirmation" value="oui" />
              <Button type="submit" disabled={enCours}>
                {enCours ? "Changement…" : "Oui, changer"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
