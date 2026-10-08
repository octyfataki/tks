"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  LinkIcon,
  ListChecksIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  creerLienInvitationAdminAction,
  type ResultatInvitationAdmin,
} from "./actions";

const ETAT_INITIAL: ResultatInvitationAdmin | null = null;

const ETAPES_APRES = [
  {
    icone: LinkIcon,
    titre: "Lien à partager",
    texte:
      "Usage unique, durée limitée : passé l'expiration, le lien est refusé visiblement et un nouveau lien doit être envoyé.",
  },
  {
    icone: UserPlusIcon,
    titre: "Le distributeur crée son compte",
    texte:
      "Il choisit lui-même son email et son mot de passe via le lien. Le rôle administrateur principal vient du lien, jamais du formulaire.",
  },
  {
    icone: ScrollTextIcon,
    titre: "Tout est tracé",
    texte:
      "Créateur, lien généré puis consommé : chaque étape laisse une trace. Déjà utilisé = refusé. Second facteur obligatoire à la 1re connexion.",
  },
];

/**
 * Invitation d'un administrateur principal : même coquille visuelle que
 * l'invitation agent (titre + actions, carte à gauche, aperçu + étapes à
 * droite). À gauche, la durée du lien (presets + saisie libre) et le rôle
 * fixé ADMIN_PRINCIPAL. À droite, l'aperçu vivant du lien et les étapes.
 * L'historique complet vit dans /admin/invitations (recherche, filtres,
 * pagination) : ce formulaire ne liste plus les liens passés. Rien
 * d'inventé côté métier : usage unique, expiration choisie [1, 30], rôle
 * fixé par le lien (anti-escalade).
 */
export function FormulaireInvitationAdmin({
  defautJours,
}: {
  /** Durée pré-remplie : le réglage en vigueur (/admin/parametres). */
  defautJours: number;
}) {
  const [resultat, action, enCours] = useActionState(
    creerLienInvitationAdminAction,
    ETAT_INITIAL,
  );
  const [duree, setDuree] = React.useState(defautJours);
  const [lienCopie, setLienCopie] = React.useState(false);

  const dureeAffichee =
    Number.isFinite(duree) && duree >= 1 ? Math.min(Math.floor(duree), 30) : 7;
  const [expirationEstimee, setExpirationEstimee] = React.useState("");
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
            Inviter un administrateur principal
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Le compte du distributeur, qui gère les dossiers clients, les
            agents et les validations. Le lien ne crée qu&apos;un compte
            administrateur principal.
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
            Lien d&apos;invitation créé — envoyez-le au distributeur, qui
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
          <h2 className="text-sm font-semibold">Lien d&apos;invitation</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Usage unique, valable 1 à 30 jours. Passé l&apos;expiration, le
            lien est refusé et un nouveau lien doit être envoyé.
          </p>

          <div className="mt-4">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
              <label htmlFor="dureeAdmin" className="text-xs font-medium">
                Durée de validité
              </label>
              <span aria-live="polite" className="text-xs text-muted-foreground">
                {dureeAffichee} jour{dureeAffichee > 1 ? "s" : ""}
                {expirationEstimee
                  ? ` · expire le ${expirationEstimee}`
                  : null}
              </span>
            </div>
            <input
              id="dureeAdmin"
              name="dureeJours"
              type="range"
              min={1}
              max={30}
              step={1}
              value={dureeAffichee}
              onChange={(event) => setDuree(Number(event.target.value))}
              aria-valuetext={`${dureeAffichee} jour${dureeAffichee > 1 ? "s" : ""}`}
              className="tks-range w-full"
              style={
                {
                  "--tks-range-track": `linear-gradient(to right, var(--primary) 0 ${((dureeAffichee - 1) / 29) * 100}%, var(--muted) ${((dureeAffichee - 1) / 29) * 100}% 100%)`,
                } as React.CSSProperties
              }
            />
            <div
              aria-hidden
              className="flex justify-between text-[11px] text-muted-foreground"
            >
              <span>1 jour</span>
              <span>30 jours</span>
            </div>
          </div>

          <Separator className="my-5" />

          <h2 className="text-sm font-semibold">Rôle attribué</h2>
          <div className="mt-3 flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <ShieldCheckIcon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium">
                Administrateur principal
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Immuable — fixé par le lien, pas par ce formulaire.
              </span>
            </span>
            <Badge variant="secondary">Fixé</Badge>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="overflow-hidden rounded-xl border bg-card">
            <div className="border-b bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  AD
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    Nouvel administrateur principal
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Email choisi par le distributeur via le lien
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Expire le {expirationEstimee} ({dureeAffichee}{" "}
                    jour{dureeAffichee > 1 ? "s" : ""})
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary">Administrateur principal</Badge>
                <Badge variant="outline">VALIDE dès inscription</Badge>
                <Badge variant="outline">Usage unique</Badge>
              </div>
            </div>
            <p className="flex items-center gap-1.5 p-4 text-[11px] text-muted-foreground">
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
        </div>
      </div>
    </form>
  );
}
