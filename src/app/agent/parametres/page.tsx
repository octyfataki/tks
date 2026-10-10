import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  FingerprintIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  SmartphoneIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";
import { Separator } from "@/components/ui/separator";
import { FormulaireMotDePasse } from "./formulaire-mot-de-passe";
import { SynchronisationSection } from "./synchronisation-section";
import { AppareilSection } from "./appareil-section";
import { decrireExpiration } from "./session-helpers";

export const metadata: Metadata = {
  title: "Paramètres — Agent — TKS",
  description:
    "Paramètres de l'agent de service : session, mot de passe, synchronisation et réglages de l'appareil.",
};

/**
 * Paramètres de l'espace agent de service. Contenu seul : la coquille
 * (navigation + AgentHeader) vit dans /agent/layout, qui garantit déjà un
 * agent de service VALIDE.
 *
 * Trois sections, trois natures (S1, S8, appareil) :
 * - Session et mot de passe : lecture de l'échéance + changement via
 *   better-auth (autres sessions révoquées — téléphone partagé).
 * - Synchronisation : état réseau réel, compteurs honnêtes en attente de S8.
 * - Appareil : thème + alertes du comptoir, `localStorage` uniquement.
 *
 * Aucun pouvoir métier ici : ni taux, ni plafond, ni promotion, ni grille
 * tarifaire — tout cela vit dans l'espace du distributeur.
 */
export default async function AgentParametresPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const expiration = decrireExpiration(
    session?.session?.expiresAt ?? null,
  );

  return (
    <div className="flex flex-1 flex-col bg-background px-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Session, mot de passe, synchronisation et réglages de cet appareil.
          Votre compte reste visible dans{" "}
          <Link
            href="/agent/profil"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Mon compte
          </Link>
          .
        </p>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <section
          aria-label="Session"
          className="rounded-xl border bg-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <FingerprintIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">
                Session
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Elle survit à la coupure réseau, mais elle expire quand même.
              </p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Expire le</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {expiration.dateFormatee}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">
                  Temps restant
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {expiration.joursRestants === null
                    ? "Inconnu"
                    : expiration.expiree
                      ? "Expirée — reconnectez-vous"
                      : `${expiration.joursRestants} jour${expiration.joursRestants > 1 ? "s" : ""}`}
                </dd>
              </div>
            </dl>
            {expiration.expireBientot ? (
              <p role="alert" className="text-xs text-destructive">
                Votre session expire bientôt : reconnectez-vous au moment
                choisi, avant d&apos;être coupé au comptoir.
              </p>
            ) : null}
            <div>
              <BoutonDeconnexion />
              <p className="mt-2 text-xs text-muted-foreground">
                En cas de téléphone perdu ou volé : la révocation n&apos;agit
                qu&apos;à la synchronisation. Prévenez le distributeur sans
                attendre.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-label="Mot de passe"
          className="rounded-xl border bg-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <KeyRoundIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">
                Mot de passe
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Changer votre mot de passe. Les autres sessions seront fermées.
              </p>
            </div>
          </div>
          <Separator className="my-4" />
          <FormulaireMotDePasse />
        </section>

        <section
          aria-label="Synchronisation"
          className="rounded-xl border bg-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <RefreshCwIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">
                Synchronisation
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Où en sont vos données — file d&apos;attente durable avec S8.
              </p>
            </div>
          </div>
          <Separator className="my-4" />
          <SynchronisationSection />
        </section>

        <section
          aria-label="Cet appareil"
          className="rounded-xl border bg-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <SmartphoneIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">
                Cet appareil
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Réglages du téléphone, jamais synchronisés.
              </p>
            </div>
          </div>
          <Separator className="my-4" />
          <AppareilSection />
        </section>
      </div>

      <Separator className="my-4" />
      <p className="text-xs leading-relaxed text-muted-foreground">
        Ni taux, ni plafond, ni promotion, ni grille tarifaire ici : ce sont
        des décisions du distributeur. Besoin d&apos;aide au comptoir ?{" "}
        <Link
          href="/agent/aide"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Ouvrir l&apos;aide
        </Link>
        .
      </p>
    </div>
  );
}
