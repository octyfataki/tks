"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Scissors, TriangleAlert } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";
import { buttonVariants } from "@/components/ui/button";
import { DepotPieceIdentite } from "./formulaire-depot-piece";
import { lireStatutCompte, type StatutCompte } from "./statut-compte";
import { demanderDestination } from "@/lib/destination-connexion";
import { cn } from "@/lib/utils";

// S1 : la page est la fiche de comptoir — le papier que le distributeur
// garde sur son bureau. Une colonne étroite, un tampon comme seul geste
// fort, des lignes de registre. Le récapitulatif vient de la session
// (clé `tks-inscription` posée par /sign-up, jamais le mot de passe).
// S1-03 : un compte REFUSE garde la même fiche mais le tampon dit le
// refus et le motif dit comment le corriger, sans réinscription.
type Recap = {
  name?: string;
  email?: string;
  telephone?: string;
  piece?: string;
  at?: number;
};

function lireRecap(): Recap {
  try {
    if (typeof window === "undefined") return {};
    const brut = sessionStorage.getItem("tks-inscription");
    if (!brut) return {};
    const enveloppe = JSON.parse(brut) as
      | { data?: Recap }
      | (Recap & { v?: number });
    if (enveloppe && typeof enveloppe === "object" && "data" in enveloppe) {
      return (enveloppe as { data?: Recap }).data ?? {};
    }
    return enveloppe as Recap;
  } catch {
    return {};
  }
}

type Etape = {
  titre: string;
  detail: string;
  statut: "faite" | "encours" | "areprendre" | "avenir";
};

const MOT_STATUT: Record<Etape["statut"], string> = {
  faite: "Fait",
  encours: "En cours",
  areprendre: "À reprendre",
  avenir: "Plus tard",
};

/** Le tampon du distributeur : le seul geste fort de la page. */
function Tampon({ estRefuse }: { estRefuse: boolean }) {
  return (
    <span
      className={cn(
        "inline-block -rotate-2 rounded-sm border-2 px-3 py-1 text-sm font-bold tracking-widest uppercase",
        estRefuse
          ? "border-destructive/70 bg-destructive/5 text-destructive"
          : "border-primary/60 bg-primary/10 text-primary-foreground",
      )}
    >
      {estRefuse ? "Refusé" : "En attente"}
    </span>
  );
}

/** Une ligne du registre : étiquette à gauche, valeur à droite. */
function LigneFiche({
  etiquette,
  valeur,
}: {
  etiquette: string;
  valeur: string;
}) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <dt className="shrink-0 text-xs text-muted-foreground">{etiquette}</dt>
      <span
        aria-hidden
        className="mx-1 flex-1 border-b border-dotted border-muted-foreground/50"
      />
      <dd className="text-right font-medium break-all">{valeur}</dd>
    </div>
  );
}

export default function PendingVue() {
  const routeur = useRouter();
  // Initialisé une fois côté client : pas d'effet, pas de rendu en cascade.
  // En prérendu serveur, le récapitulatif est vide puis hydraté.
  const [recap] = useState<Recap>(() => lireRecap());
  // Statut serveur (état + motif) : source unique partagée avec le dépôt.
  // C'est aussi le canal qui fait communiquer /pending avec
  // /admin/clients/validation : la décision de l'administrateur (valider /
  // refuser) y arrive via GET /api/mon-compte/piece.
  const [statut, setStatut] = useState<StatutCompte | null>(null);
  const [compteurStatut, setCompteurStatut] = useState(0);

  const chargerStatut = useCallback(async () => {
    const lu = await lireStatutCompte();
    // Hors-ligne : une coupure réseau ressemble à « non connecté ».
    // On garde le dernier statut connecté connu plutôt que de
    // déconnecter la fiche à tort (offline-first). Seule une réponse
    // explicite du serveur (connecte: false sans horsLigne) fait retomber
    // la fiche — par exemple après une déconnexion dans un autre onglet.
    setStatut((precedent) => {
      if (lu.connecte) return lu;
      if (lu.horsLigne) {
        if (precedent === null) return lu;
        if (precedent.connecte) return precedent;
        return lu;
      }
      return lu;
    });
  }, []);

  useEffect(() => {
    let actif = true;
    chargerStatut().catch(() => {});
    // Scrutation : l'administrateur tranche depuis
    // /admin/clients/validation pendant que le client attend ici.
    // Sans elle, la fiche resterait figée jusqu'au rechargement manuel.
    const minuteur = window.setInterval(() => {
      if (document.visibilityState === "visible") chargerStatut().catch(() => {});
    }, 8000);
    const rafraichir = () => {
      chargerStatut().catch(() => {});
    };
    const surVisibilite = () => {
      if (document.visibilityState === "visible") rafraichir();
    };
    window.addEventListener("focus", rafraichir);
    window.addEventListener("online", rafraichir);
    document.addEventListener("visibilitychange", surVisibilite);
    return () => {
      actif = false;
      void actif;
      window.clearInterval(minuteur);
      window.removeEventListener("focus", rafraichir);
      window.removeEventListener("online", rafraichir);
      document.removeEventListener("visibilitychange", surVisibilite);
    };
  }, [chargerStatut, compteurStatut]);

  const signalerDepot = useCallback(() => {
    setCompteurStatut((n) => n + 1);
  }, []);

  const estValide =
    statut !== null && statut.connecte && statut.etat === "VALIDE";

  // L'autre sens de la communication : un compte validé dans
  // /admin/clients/validation n'attend plus — il rejoint son espace.
  // La destination vient du serveur (rôle + état), jamais devinée ici.
  useEffect(() => {
    if (!estValide) return;
    let actif = true;
    demanderDestination().then((reponse) => {
      if (!actif) return;
      if (reponse.destination !== "/pending") {
        routeur.push(reponse.destination);
        routeur.refresh();
      }
    });
    return () => {
      actif = false;
    };
  }, [estValide, routeur]);

  // Garde client : la fiche suit la session. Un anonyme sans récapitulatif
  // local (juste après /sign-up) n'a rien à y lire : il retourne à la
  // connexion. Le serveur fait déjà ce tri à l'arrivée ; ici on couvre la
  // perte de session pendant que la page est ouverte (déconnexion ailleurs,
  // session expirée). Le hors-ligne ne déclenche rien : la fiche connue
  // reste affichée (offline-first).
  const aRecap =
    recap.name !== undefined ||
    recap.email !== undefined ||
    recap.telephone !== undefined ||
    recap.at !== undefined;
  const estAnonymeExplicite =
    statut !== null && !statut.connecte && !statut.horsLigne;
  useEffect(() => {
    if (estAnonymeExplicite && !aRecap) {
      routeur.replace("/sign-in");
    }
  }, [estAnonymeExplicite, aRecap, routeur]);

  const estRefuse =
    statut !== null && statut.connecte && statut.etat === "REFUSE";
  const connecte = statut !== null && statut.connecte;
  const motif =
    statut !== null && statut.connecte ? (statut.motifRefus ?? null) : null;

  const session = statut !== null && statut.connecte ? statut : null;

  // L'identité vient de la session connectée d'abord : la fiche suit le
  // compte, pas l'onglet. Le récapitulatif local n'est qu'un repli (juste
  // après l'inscription, avant la première connexion).
  const nom = session?.nom ?? recap.name;
  const email = session?.email ?? recap.email;
  const telephone = session?.telephone ?? recap.telephone;
  const pieceDeposee =
    recap.piece !== undefined && recap.piece !== "comptoir";

  function formaterDate(valeur: string | number): string | null {
    const date = new Date(valeur);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("fr-CD", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const dateEnvoi =
    session?.inscritLe != null
      ? (formaterDate(session.inscritLe) ??
        (recap.at !== undefined ? formaterDate(recap.at) : null))
      : recap.at !== undefined
        ? formaterDate(recap.at)
        : null;

  const etapes: Etape[] = estRefuse
    ? [
        {
          titre: "Informations envoyées",
          detail: dateEnvoi ? `Envoyées le ${dateEnvoi}` : "Demande enregistrée",
          statut: "faite",
        },
        {
          titre: "Pièce d'identité",
          detail: pieceDeposee
            ? "Vue puis refusée — voyez le motif"
            : "Refusée — déposez une nouvelle pièce",
          statut: "areprendre",
        },
        {
          titre: "Validation par le distributeur",
          detail: "Refusée — corrigez avec le motif",
          statut: "areprendre",
        },
        {
          titre: "Rattachement à votre dossier",
          detail: "Votre compte rejoint votre dossier, désigné par son nom",
          statut: "avenir",
        },
      ]
    : [
        {
          titre: "Informations envoyées",
          detail: dateEnvoi ? `Envoyées le ${dateEnvoi}` : "Demande enregistrée",
          statut: "faite",
        },
        {
          titre: "Pièce d'identité",
          detail: pieceDeposee
            ? `Reçue ici (${recap.piece})`
            : "À présenter au comptoir",
          statut: pieceDeposee ? "faite" : "encours",
        },
        {
          titre: "Validation par le distributeur",
          detail: "Un humain vérifie votre pièce, puis valide le compte",
          statut: "avenir",
        },
        {
          titre: "Rattachement à votre dossier",
          detail: "Votre compte rejoint votre dossier, désigné par son nom",
          statut: "avenir",
        },
      ];

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Fond pointillé du thème, très atténué, + halo or en haut */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 18%, transparent) 1.2px, transparent 1.2px)",
          backgroundSize: "18px 18px",
          maskImage:
            "radial-gradient(ellipse 90% 60% at 50% 0%, black 10%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 60% at 50% 0%, black 10%, transparent 75%)",
        }}
      />
      <div aria-hidden className="relative z-10 h-1 shrink-0 bg-primary" />
      <header className="relative z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="TKS — accueil" className="inline-flex">
            <BrandLogo height={28} />
          </Link>
          {connecte ? (
            <BoutonDeconnexion />
          ) : (
            <Link
              href="/sign-in"
              className={buttonVariants({ variant: "ghost" }) + " text-xs"}
            >
              Retour à la connexion
            </Link>
          )}
        </div>
      </header>

      <main className="tks-ticket-enter relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        {estValide ? (
          <section
            role="status"
            aria-label="Compte validé"
            className="rounded-xl border border-green-600/40 bg-green-600/5 px-5 py-4"
          >
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              Compte validé — redirection vers votre espace…
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Le distributeur a vu votre pièce. Si la redirection tarde,{" "}
              <Link href="/clients" className="underline underline-offset-4">
                ouvrez votre espace
              </Link>
              .
            </p>
          </section>
        ) : null}
        <div>
          <Tampon estRefuse={estRefuse} />
          <h1 className="font-heading mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {estRefuse
              ? "Le distributeur n'a pas validé votre compte"
              : "Votre compte attend sa validation"}
          </h1>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {estRefuse
              ? "Lisez le motif, puis déposez une meilleure pièce : votre compte sera revu sans réinscription. Tant qu'il n'est pas validé puis rattaché, il ne peut rien faire — ni dossier, ni solde, ni commande, pas même prépayée."
              : "Gardez cette fiche : présentez votre pièce d'identité au comptoir, ou attendez qu'un humain du distributeur la vérifie. Tant que le compte n'est pas validé puis rattaché, il ne peut rien faire — ni dossier, ni solde, ni commande, pas même prépayée."}
          </p>
        </div>

        {estRefuse ? (
          <section
            role="alert"
            aria-label="Motif du distributeur"
            className="rounded-r-xl border-l-4 border-destructive bg-destructive/5 px-5 py-4"
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              Motif du distributeur
            </h2>
            <blockquote className="mt-2 text-base leading-relaxed">
              «&nbsp;
              {motif ??
                "Le distributeur n'a pas précisé le motif. Déposez une pièce plus lisible."}
              &nbsp;»
            </blockquote>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Déposez une nouvelle pièce ci-dessous : un humain la reverra,
              sans réinscription.
            </p>
          </section>
        ) : null}

        <section
          aria-label="Fiche de demande"
          className="overflow-hidden rounded-xl border-2 bg-card"
        >
          <div className="p-5 sm:p-6">
            <p className="text-xs text-muted-foreground">Fiche de demande</p>
            <p className="font-heading mt-1 text-2xl font-semibold tracking-tight">
              {nom ||
                (estRefuse
                  ? "Demande à corriger"
                  : "Demande en cours de vérification")}
            </p>
            {email || telephone || dateEnvoi ? (
              <dl className="mt-4 flex flex-col gap-2.5">
                {email ? (
                  <LigneFiche etiquette="Email" valeur={email} />
                ) : null}
                {telephone ? (
                  <LigneFiche etiquette="Téléphone" valeur={telephone} />
                ) : null}
                {dateEnvoi ? (
                  <LigneFiche etiquette="Envoyée le" valeur={dateEnvoi} />
                ) : null}
              </dl>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Connectez-vous avec votre email pour voir l&apos;avancement de
                votre demande.
              </p>
            )}
          </div>

          <div aria-hidden className="flex items-center px-4">
            <span className="h-px flex-1 border-t border-dashed" />
            <span className="-my-3 flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground">
              <Scissors className="size-3.5" />
            </span>
            <span className="h-px flex-1 border-t border-dashed" />
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-sm font-semibold">
              {estRefuse
                ? "Nouvelle pièce à déposer"
                : pieceDeposee
                  ? `Pièce reçue : ${recap.piece}`
                  : "Pièce à présenter au comptoir"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Sans pièce vue par un humain, le compte ne sera pas validé.
            </p>
          </div>
        </section>

        <DepotPieceIdentite statut={statut} onPieceDeposee={signalerDepot} />

        <section aria-label="Où en est votre demande">
          <h2 className="text-sm font-semibold">Où en est votre demande</h2>
          <ol className="mt-2">
            {etapes.map((etape) => (
              <li
                key={etape.titre}
                aria-current={
                  etape.statut === "encours" || etape.statut === "areprendre"
                    ? "step"
                    : undefined
                }
                className="flex items-baseline justify-between gap-4 border-b border-dashed py-3 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium">{etape.titre}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {etape.detail}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold",
                    etape.statut === "encours" && "text-primary-foreground",
                    etape.statut === "areprendre" && "text-destructive",
                    etape.statut === "avenir" && "text-muted-foreground",
                  )}
                >
                  {MOT_STATUT[etape.statut]}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-label="Ce qu'on attend de vous"
          className="rounded-xl border bg-card p-5 sm:p-6"
        >
          <h2 className="text-sm font-semibold">Ce qu&apos;on attend de vous</h2>
          <ul className="mt-3 flex flex-col gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-primary"
                strokeWidth={3}
              />
              {estRefuse
                ? "Une nouvelle pièce lisible qui répond au motif ci-dessus"
                : "Une pièce d'identité avec photo, à montrer au comptoir"}
            </li>
            <li className="flex items-start gap-2">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-primary"
                strokeWidth={3}
              />
              Le numéro de téléphone utilisé pour votre inscription
            </li>
            <li className="flex items-start gap-2">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-primary"
                strokeWidth={3}
              />
              Rien d&apos;autre : la validation ne demande aucun paiement
            </li>
          </ul>
              {connecte ? (
                <BoutonDeconnexion className="mt-4 w-full" />
              ) : (
                <Link
                  href="/sign-in"
                  className={
                    buttonVariants({ variant: "default" }) + " mt-4 w-full"
                  }
                >
                  Retour à la connexion
                </Link>
              )}
        </section>
      </main>

      <footer className="relative z-10 border-t bg-background/80 backdrop-blur">
        <p className="mx-auto w-full max-w-2xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          Un compte non validé ne voit aucun dossier et aucun solde. La
          validation dit que vous êtes client ; le rattachement, fait ensuite
          par le distributeur, dit que vous êtes ce client-là.
        </p>
      </footer>
    </div>
  );
}
