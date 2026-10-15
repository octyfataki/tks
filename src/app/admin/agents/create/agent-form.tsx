"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  AtSignIcon,
  CircleCheckIcon,
  KeyRoundIcon,
  ListChecksIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  PhoneIcon,
  ScrollTextIcon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { creerAgentAction, type ResultatAction } from "../actions";

const ETAT_INITIAL: ResultatAction | null = null;

const ETAPES_APRES = [
  {
    icone: KeyRoundIcon,
    titre: "Transmettez le mot de passe",
    texte: "Une seule fois, par un canal sûr : l'agent le changera à sa première connexion.",
  },
  {
    icone: UserPlusIcon,
    titre: "Zéro permission par défaut",
    texte: "Le compte s'authentifie mais ne peut rien faire : accordez les permissions depuis la fiche ou la matrice globale.",
  },
  {
    icone: ScrollTextIcon,
    titre: "Tout est tracé",
    texte: "Qui l'a créé, quand : la création laisse une trace au journal.",
  },
];

/**
 * Création directe d'un agent de service (comptoir : l'agent est présent,
 * fiche remplie ensemble). Rôle fixé AGENT, état VALIDE, zéro permission.
 * Le lien d'invitation reste l'autre voie (agent distant qui crée lui-même
 * son compte via /invite/[jeton]).
 */
export function FormulaireAgent() {
  const [resultat, action, enCours] = useActionState(creerAgentAction, ETAT_INITIAL);
  const [prenom, setPrenom] = React.useState("");
  const [nom, setNom] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telephone, setTelephone] = React.useState("");
  const [motDePasse, setMotDePasse] = React.useState("");
  const [motDePasseVisible, setMotDePasseVisible] = React.useState(false);
  const dernierResultat = React.useRef<ResultatAction | null>(null);

  // Tout le feedback (succès comme refus) passe par les toasts : pas de
  // message inline. Succès -> formulaire réinitialisé pour enchaîner.
  React.useEffect(() => {
    if (!resultat || dernierResultat.current === resultat) return;
    dernierResultat.current = resultat;
    if (resultat.ok) {
      toast.add({
        type: "success",
        title: "Agent créé",
        description: `Compte actif pour ${resultat.email ?? "l'agent"}. Accordez-lui ses permissions depuis sa fiche.`,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- réinitialise le formulaire après succès, une fois par résultat
      setPrenom("");
      setNom("");
      setEmail("");
      setTelephone("");
      setMotDePasse("");
    } else {
      toast.add({
        type: "error",
        title: "Création impossible",
        description: resultat.erreur,
      });
    }
  }, [resultat]);

  const nomComplet = `${prenom} ${nom}`.trim() || "Nouvel agent";
  const initiales =
    `${prenom.trim().charAt(0)}${nom.trim().charAt(0)}`.toUpperCase() || "AG";

  return (
    <form action={action} className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Créer un agent de service</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Employé du distributeur, terrain, travaille hors-ligne. Compte actif
            aussitôt, sans permission : à vous de les accorder ensuite.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/agents" className={buttonVariants({ variant: "outline" })}>
            Annuler
          </Link>
          <Button type="submit" disabled={enCours}>
            {enCours ? "Création…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border bg-card p-4 sm:p-5">
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
                  placeholder="agent@exemple.cd"
                  className="peer rounded-lg pr-9 pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <CircleCheckIcon className="pointer-events-none absolute top-1/2 right-3 hidden size-4 -translate-y-1/2 text-green-600 peer-valid:block" />
              </div>
              <FieldDescription className="mt-1.5">
                Identifiant de connexion. La confiance passe par l&apos;email, jamais par SMS.
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
                Contact uniquement — jamais identifiant, jamais vérifié.
              </FieldDescription>
            </div>
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
                  required
                  minLength={8}
                  placeholder="Au moins 8 caractères"
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
              <FieldDescription className="mt-1.5">
                Transmis à l&apos;agent une seule fois, par un canal sûr.
              </FieldDescription>
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
                  Agent de service
                </span>
                <span className="rounded-full bg-green-600/10 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  VALIDE dès création
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  0 permission
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
              {ETAPES_APRES.map((etape, index) => (
                <li key={etape.titre} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < ETAPES_APRES.length - 1 ? (
                    <span aria-hidden className="absolute top-8 bottom-0 left-4 w-px bg-border" />
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
