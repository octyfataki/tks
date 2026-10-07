"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  CalendarClockIcon,
  CircleCheckIcon,
  LinkIcon,
  ListChecksIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  creerLienInvitationAgentAction,
  type ResultatInvitationAgent,
} from "./actions";

const ETAT_INITIAL: ResultatInvitationAgent | null = null;

const ETAPES_APRES = [
  {
    icone: LinkIcon,
    titre: "Lien à partager",
    texte:
      "Usage unique, durée limitée : passé l'expiration, le lien est refusé visiblement et un nouveau lien doit être envoyé.",
  },
  {
    icone: UserPlusIcon,
    titre: "L'agent crée son compte",
    texte:
      "Il choisit lui-même son email et son mot de passe via le lien. Le rôle agent de service vient du lien, jamais du formulaire.",
  },
  {
    icone: ScrollTextIcon,
    titre: "Tout est tracé",
    texte:
      "Créateur, lien généré puis consommé : chaque étape laisse une trace. Déjà utilisé = refusé.",
  },
];

function TitreSection({ numero, titre }: { numero: string; titre: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
        {numero}
      </span>
      <h2 className="text-sm font-medium">{titre}</h2>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}

export type InvitationAgentLigne = {
  id: string;
  jeton: string;
  expireLe: Date;
  consommeLe: Date | null;
};

/**
 * Invitation d'un agent de service : même coquille visuelle que
 * /admin/create (titre + actions, carte à gauche, aperçu + étapes à
 * droite). À gauche, 01 règle la durée du lien et 02 rappelle le rôle
 * fixé AGENT. À droite, l'aperçu vivant du lien et les liens récents.
 * Rien d'inventé côté métier : usage unique, expiration choisie [1, 30],
 * rôle fixé par le lien (anti-escalade).
 */
export function FormulaireInvitationAgent({
  defautJours,
  invitations,
}: {
  /** Durée pré-remplie : le réglage en vigueur (/admin/parametres). */
  defautJours: number;
  /** Derniers liens AGENT, plus récents d'abord. */
  invitations: InvitationAgentLigne[];
}) {
  const [resultat, action, enCours] = useActionState(
    creerLienInvitationAgentAction,
    ETAT_INITIAL,
  );
  const [duree, setDuree] = React.useState(defautJours);
  const [lienCopie, setLienCopie] = React.useState(false);

  const dureeAffichee =
    Number.isFinite(duree) && duree >= 1 ? Math.min(Math.floor(duree), 30) : 7;
  const [expirationEstimee, setExpirationEstimee] = React.useState("");
  const [maintenant, setMaintenant] = React.useState(0);
  const lienCree = resultat && resultat.ok ? resultat.lien : null;
  React.useEffect(() => {
    // Aperçu vivant : date dérivée de la durée saisie (effet = lecture
    // d'horloge hors rendu, conforme react-hooks/purity).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- aperçu dérivé, pas de boucle
    setExpirationEstimee(
      new Date(
        Date.now() + dureeAffichee * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("fr-FR"),
    );
    setMaintenant(Date.now());
  }, [dureeAffichee]);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- réarme l'indicateur « Copié » à chaque nouveau lien
    setLienCopie(false);
  }, [lienCree]);

  return (
    <form action={action} className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Inviter un agent de service
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Le distributeur crée un lien à usage unique et à durée limitée. Le
            lien ne crée qu&apos;un compte agent de service.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/dashboard" />}>
            Annuler
          </Button>
          <Button type="submit" disabled={enCours}>
            {enCours ? "Génération…" : "Générer le lien"}
          </Button>
        </div>
      </div>

      {resultat && !resultat.ok ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {resultat.erreur}
        </p>
      ) : null}
      {resultat?.ok ? (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-lg border border-green-600/30 bg-green-600/5 p-3"
        >
          <p className="text-xs font-medium text-green-700">
            Lien d&apos;invitation créé — envoyez-le à l&apos;agent, qui
            choisira lui-même son email et son mot de passe.
          </p>
          <div className="flex items-center gap-2">
            <code
              title={resultat.lien}
              className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 font-mono text-[11px] break-all select-all"
            >
              {resultat.lien}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}${resultat.lien}`,
                  );
                  setLienCopie(true);
                } catch {
                  setLienCopie(false);
                }
              }}
            >
              {lienCopie ? "Copié ✓" : "Copier"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <TitreSection numero="01" titre="Lien d'invitation" />
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="dureeJours"
                  className="block text-xs font-medium"
                >
                  Durée de validité (jours)
                </label>
                <span
                  aria-live="polite"
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                >
                  {dureeAffichee} jour{dureeAffichee > 1 ? "s" : ""}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={dureeAffichee}
                onChange={(event) => setDuree(Number(event.target.value))}
                aria-label="Durée de validité en jours (curseur, entre 1 et 30)"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
              <div
                aria-hidden
                className="mt-1 flex justify-between text-[10px] text-muted-foreground"
              >
                <span>1 jour</span>
                <span>30 jours</span>
              </div>
              <div className="group relative mt-2">
                <CalendarClockIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="dureeJours"
                  name="dureeJours"
                  type="number"
                  min={1}
                  max={30}
                  required
                  className="rounded-lg pl-9"
                  value={Number.isFinite(duree) ? duree : ""}
                  onChange={(event) => {
                    const brut = event.target.value;
                    setDuree(brut === "" ? Number.NaN : Number(brut));
                  }}
                />
              </div>
              <FieldDescription className="mt-1.5">
                Entre 1 et 30 jours. Passé l&apos;expiration, le lien est
                refusé visiblement et un nouveau lien doit être envoyé. Usage
                unique : déjà utilisé = refusé.
              </FieldDescription>
            </div>
          </div>

          <div className="mt-6">
            <TitreSection numero="02" titre="Rôle attribué" />
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium">
                  Agent de service
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  Immuable : le lien fixe le rôle, l&apos;agent choisit
                  l&apos;email. Un lien agent ne crée jamais un autre rôle.
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-600/10 px-2 py-0.5 text-[11px] font-medium text-green-700">
                <CircleCheckIcon className="size-3" />
                Fixé
              </span>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="overflow-hidden rounded-xl border bg-card">
            <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-4 pb-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  AG
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    Nouvel agent de service
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Email choisi par l&apos;agent via le lien
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Expire le {expirationEstimee} ({dureeAffichee}{" "}
                    jour{dureeAffichee > 1 ? "s" : ""})
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Agent de service
                </span>
                <span className="rounded-full bg-green-600/10 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  VALIDE dès inscription
                </span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  Usage unique
                </span>
              </div>
            </div>
            <p className="flex items-center gap-1.5 p-4 pt-3 text-[11px] text-muted-foreground">
              <ListChecksIcon className="size-3.5 shrink-0" />
              Aperçu en direct — il se remplit pendant la saisie.
            </p>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-medium">Après l&apos;invitation</h2>
            <ol className="mt-3 flex flex-col">
              {ETAPES_APRES.map((etape, index) => (
                <li
                  key={etape.titre}
                  className="relative flex gap-3 pb-4 last:pb-0"
                >
                  {index < ETAPES_APRES.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute top-8 bottom-0 left-4 w-px bg-border"
                    />
                  ) : null}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted/50">
                    <etape.icone className="size-3.5 text-primary" />
                  </span>
                  <div>
                    <p className="text-xs font-medium">{etape.titre}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {etape.texte}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-medium">
              Liens agent ({invitations.length})
            </h2>
            {invitations.length === 0 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Aucun lien généré pour l&apos;instant.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-1.5">
                {invitations.map((invitation) => {
                  const expiree =
                    !invitation.consommeLe &&
                    maintenant > 0 &&
                    invitation.expireLe.getTime() < maintenant;
                  return (
                    <li
                      key={invitation.id}
                      className="flex flex-col gap-1 rounded-md border p-2"
                    >
                      <span
                        title={`/invite/${invitation.jeton}`}
                        className="font-mono text-[11px] break-all select-all"
                      >
                        /invite/{invitation.jeton}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {invitation.consommeLe
                          ? "Déjà utilisé — refusé"
                          : expiree
                            ? `Expiré le ${invitation.expireLe.toLocaleDateString("fr-FR")} — envoyez un nouveau lien`
                            : `Expire le ${invitation.expireLe.toLocaleDateString("fr-FR")}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </form>
  );
}
