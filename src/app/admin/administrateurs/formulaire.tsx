"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  AtSignIcon,
  CircleCheckIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  LinkIcon,
  ListChecksIcon,
  LockIcon,
  PhoneIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  creerAdministrateurPrincipalAction,
  type ResultatCreationAdmin,
} from "./actions";

const ETAT_INITIAL: ResultatCreationAdmin | null = null;

function forceMotDePasse(motDePasse: string): { score: number; label: string } {
  let score = 0;
  if (motDePasse.length >= 8) score += 1;
  if (motDePasse.length >= 12) score += 1;
  if (/[a-z]/.test(motDePasse) && /[A-Z]/.test(motDePasse)) score += 1;
  if (/\d/.test(motDePasse)) score += 1;
  if (/[^A-Za-z0-9]/.test(motDePasse)) score += 1;
  if (score <= 2) return { score, label: "Fragile" };
  if (score <= 3) return { score, label: "Correct" };
  if (score <= 4) return { score, label: "Solide" };
  return { score, label: "Excellent" };
}

const ETAPES_LIEN = [
  {
    icone: LinkIcon,
    titre: "Lien à partager",
    texte: "Usage unique, 24 h : la personne choisit elle-même son mot de passe. Le lien n'ouvre aucune session.",
  },
  {
    icone: UserPlusIcon,
    titre: "Compte actif aussitôt",
    texte: "VALIDE dès la création, sans attente ni validation.",
  },
  {
    icone: KeyRoundIcon,
    titre: "Second facteur à la 1re connexion",
    texte: "Application d'authentification, jamais par SMS.",
  },
  {
    icone: ScrollTextIcon,
    titre: "Tout est tracé",
    texte: "Créateur, lien généré puis consommé : chaque étape laisse une trace.",
  },
];

const ETAPES_CLASSIQUE = [
  {
    icone: KeyRoundIcon,
    titre: "Transmettez le mot de passe",
    texte: "Une seule fois, par un canal sûr : la personne le changera à sa première connexion.",
  },
  {
    icone: UserPlusIcon,
    titre: "Compte actif aussitôt",
    texte: "VALIDE dès la création, sans attente ni validation.",
  },
  {
    icone: ScrollTextIcon,
    titre: "Tout est tracé",
    texte: "Qui l'a créé, quand : la création laisse une trace.",
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

/**
 * Création d'un administrateur principal : la sidebar reste visible (coquille
 * SidebarProvider de la page). Formulaire en deux temps (01 Identité, 02
 * Accès) avec icônes réactives au focus, mot de passe affichable, jauge de
 * force et rôle en carte sélectionnée. À droite, l'aperçu vivant du compte
 * et le parcours après-création. Rien d'inventé côté métier : prénom + nom,
 * email, mot de passe initial, rôle fixé, 2FA obligatoire.
 */
export function FormulaireAdministrateurPrincipal() {
  const [resultat, action, enCours] = useActionState(
    creerAdministrateurPrincipalAction,
    ETAT_INITIAL,
  );
  const [prenom, setPrenom] = React.useState("");
  const [nom, setNom] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telephone, setTelephone] = React.useState("");
  const [motDePasse, setMotDePasse] = React.useState("");
  const [motDePasseVisible, setMotDePasseVisible] = React.useState(false);
  const [lienDemande, setLienDemande] = React.useState(true);
  const [lienCopie, setLienCopie] = React.useState(false);

  const nomComplet = `${prenom} ${nom}`.trim() || "Nouveau distributeur";
  const etapesApres = lienDemande ? ETAPES_LIEN : ETAPES_CLASSIQUE;
  const initiales =
    `${prenom.trim().charAt(0)}${nom.trim().charAt(0)}`.toUpperCase() || "AD";
  const force = forceMotDePasse(motDePasse);

  return (
    <form action={action} className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Créer un administrateur principal
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Le compte du distributeur, qui gère les dossiers clients, les
            agents et les validations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/list" />}>
            Annuler
          </Button>
          <Button type="submit" disabled={enCours}>
            {enCours ? "Création…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {resultat && !resultat.ok ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {resultat.erreur}
        </p>
      ) : null}
      {resultat?.ok ? (
        <div role="status" className="flex flex-col gap-2 rounded-lg border border-green-600/30 bg-green-600/5 p-3">
          <p className="text-xs font-medium text-green-700">
            Compte administrateur principal créé pour {resultat.email}. Il
            gère désormais les dossiers clients.
          </p>
          {resultat.lienPremierAcces ? (
            <>
              <p className="text-[11px] text-muted-foreground">
                Partagez ce lien à usage unique (valide 24 h{(resultat.expireLe
                  ? `, jusqu'au ${new Date(resultat.expireLe).toLocaleString("fr-FR")}`
                  : "")}) : la personne choisira elle-même son mot de passe.
                Le lien n&apos;ouvre aucune session.
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md border bg-background px-2 py-1 font-mono text-[11px]">
                  {resultat.lienPremierAcces}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `${window.location.origin}${resultat.lienPremierAcces}`,
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
            </>
          ) : null}
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <TitreSection numero="01" titre="Identité" />
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <span className="mb-1.5 block text-xs font-medium">Nom complet</span>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="group relative">
                  <UserIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="prenom"
                    name="prenom"
                    type="text"
                    autoComplete="given-name"
                    required
                    placeholder="Prénom"
                    className="rounded-lg pl-9"
                    value={prenom}
                    onChange={(event) => setPrenom(event.target.value)}
                  />
                </div>
                <div className="group relative">
                  <Input
                    id="nom"
                    name="nom"
                    type="text"
                    autoComplete="family-name"
                    required
                    placeholder="Nom"
                    className="rounded-lg"
                    value={nom}
                    onChange={(event) => setNom(event.target.value)}
                  />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium">
                Adresse email
              </label>
              <div className="group relative">
                <AtSignIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="distributeur@exemple.cd"
                  className="peer rounded-lg pr-9 pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <CircleCheckIcon className="pointer-events-none absolute top-1/2 right-3 hidden size-4 -translate-y-1/2 text-green-600 peer-valid:block" />
              </div>
              <FieldDescription className="mt-1.5">
                Identifiant de connexion. La coche verte confirme un format
                valide avant l&apos;envoi.
              </FieldDescription>
            </div>
            <div>
              <label htmlFor="telephone" className="mb-1.5 block text-xs font-medium">
                Numéro de téléphone{" "}
                <span className="font-normal text-muted-foreground">(optionnel)</span>
              </label>
              <div className="group relative">
                <PhoneIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+243 …"
                  className="rounded-lg pl-9"
                  value={telephone}
                  onChange={(event) => setTelephone(event.target.value)}
                />
              </div>
              <FieldDescription className="mt-1.5">
                Contact uniquement — aucune vérification par SMS : la confiance
                passe par l&apos;email.
              </FieldDescription>
            </div>
          </div>

          <div className="mt-6">
            <TitreSection numero="02" titre="Accès" />
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
              <input
                type="checkbox"
                name="lienPremierAcces"
                value="on"
                checked={lienDemande}
                onChange={(event) => setLienDemande(event.target.checked)}
                className="mt-0.5 size-3.5 accent-primary"
              />
              <span>
                <span className="block text-xs font-medium">
                  Lien de premier accès (recommandé)
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  Aucun mot de passe à transmettre : la personne choisit
                  elle-même le sien via un lien à usage unique (24 h). Le lien
                  n&apos;ouvre aucune session.
                </span>
              </span>
            </label>
            <div>
              <label htmlFor="motDePasse" className="mb-1.5 block text-xs font-medium">
                Mot de passe initial
              </label>
              <div className="group relative">
                <LockIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="motDePasse"
                  name="motDePasse"
                  type={motDePasseVisible ? "text" : "password"}
                  autoComplete="new-password"
                  required={!lienDemande}
                  disabled={lienDemande}
                  minLength={8}
                  placeholder={
                    lienDemande
                      ? "Inutile avec le lien de premier accès"
                      : "Au moins 8 caractères"
                  }
                  className="rounded-lg pr-10 pl-9"
                  value={motDePasse}
                  onChange={(event) => setMotDePasse(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMotDePasseVisible((visible) => !visible)}
                  aria-label={motDePasseVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  aria-pressed={motDePasseVisible}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {motDePasseVisible ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
              {motDePasse ? (
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`Force du mot de passe : ${force.label}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        force.score <= 2
                          ? "bg-destructive"
                          : force.score <= 3
                            ? "bg-amber-500"
                            : "bg-green-600"
                      }`}
                      style={{ width: `${(force.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">{force.label}</span>
                </div>
              ) : null}
              <FieldDescription className="mt-1.5">
                {lienDemande
                  ? "Ignoré : avec le lien, aucun secret n'est choisi ni transmis."
                  : "Transmis à la personne une seule fois, par un canal sûr : elle le changera à sa première connexion."}
              </FieldDescription>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium">Rôle attribué</span>
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheckIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium">
                    Administrateur principal
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    Immuable : révocation + recréation tracées (S2).
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-600/10 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  <CircleCheckIcon className="size-3" />
                  Fixé
                </span>
              </div>
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
                  {initiales}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{nomComplet}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {email || "email@exemple.cd"}
                  </p>
                  {telephone.trim() ? (
                    <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      <PhoneIcon className="size-3 shrink-0" />
                      {telephone.trim()}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Administrateur principal
                </span>
                <span className="rounded-full bg-green-600/10 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  VALIDE dès création
                </span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  2FA obligatoire
                </span>
              </div>
            </div>
            <p className="flex items-center gap-1.5 p-4 pt-3 text-[11px] text-muted-foreground">
              <ListChecksIcon className="size-3.5 shrink-0" />
              Aperçu en direct — il se remplit pendant la saisie.
            </p>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-medium">Après la création</h2>
            <ol className="mt-3 flex flex-col">
              {etapesApres.map((etape, index) => (
                <li key={etape.titre} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < etapesApres.length - 1 ? (
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
