import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  BellIcon,
  CheckIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
  UsersIcon,
  WifiOffIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { describeSessionExpiration } from "@/app/agent/settings/session-helpers";
import { NetworkIndicator } from "@/app/agent/settings/network-indicator";
import { SyncSection } from "@/app/agent/settings/sync-section";
import { FormulaireMotDePasse } from "./formulaire-mot-de-passe";
import { AppareilSection } from "./appareil-section";
import { NotificationsSection } from "./notifications-section";

export const metadata: Metadata = {
  title: "Paramètres — Client — TKS",
  description:
    "Paramètres du client : session, mot de passe, synchronisation et réglages de l'appareil.",
};

export default async function ClientsParametresPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const sessionExpiration = describeSessionExpiration(
    session?.session?.expiresAt ?? null,
  );
  const isSessionAtRisk = sessionExpiration.isExpired || sessionExpiration.expiresSoon;

  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight">
            Paramètres
          </h1>
          {isSessionAtRisk ? (
            <Badge variant="destructive">
              <TriangleAlertIcon />
              Session à renouveler
            </Badge>
          ) : (
            <Badge variant="secondary">Compte prêt</Badge>
          )}
          <NetworkIndicator />
        </div>
        <p className="max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
          Votre téléphone, votre session, votre mot de passe. Vos informations restent
          visibles dans{" "}
          <Link
            href="/clients/profil"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Mon compte
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <section aria-labelledby="titre-securite" className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary-foreground [&_svg]:size-4">
              <ShieldCheckIcon />
            </span>
            <div>
              <h2
                id="titre-securite"
                className="text-sm font-semibold tracking-tight"
              >
                Sécurité du compte
              </h2>
              <p className="text-xs text-muted-foreground">
                Qui peut ouvrir votre compte, et jusqu’à quand.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Session en cours</CardTitle>
              <CardDescription>
                Elle survit à la coupure réseau, mais elle expire quand même.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-xs text-muted-foreground">Expire le</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {sessionExpiration.formattedDate}
                  </p>
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={7}
                  aria-valuenow={Math.max(
                    0,
                    Math.min(7, sessionExpiration.daysRemaining ?? 0),
                  )}
                  aria-label="Temps de session restant"
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: `${Math.max(0, Math.min(100, ((sessionExpiration.daysRemaining ?? 0) / 7) * 100))}%`,
                    }}
                    className={
                      isSessionAtRisk
                        ? "h-full rounded-full bg-destructive"
                        : "h-full rounded-full bg-primary"
                    }
                  />
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-xs text-muted-foreground">Temps restant</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {sessionExpiration.daysRemaining === null
                      ? "Inconnu"
                      : sessionExpiration.isExpired
                        ? "Expirée — reconnectez-vous"
                        : sessionExpiration.daysRemaining <= 0
                          ? "Dernier jour"
                          : `${sessionExpiration.daysRemaining} jour${sessionExpiration.daysRemaining > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              {sessionExpiration.expiresSoon ? (
                <p
                  role="alert"
                  className="rounded-md bg-destructive/8 px-3 py-2 text-xs leading-relaxed text-destructive"
                >
                  Votre session expire bientôt : reconnectez-vous au moment
                  choisi, avant d’être coupé.
                </p>
              ) : null}
              <div className="flex flex-col gap-2 border-t border-dashed pt-4">
                <BoutonDeconnexion className="self-start" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Téléphone perdu ou volé : la révocation n’agit qu’à la
                  synchronisation. Prévenez le distributeur sans attendre.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRoundIcon className="size-4 text-muted-foreground" />
                <CardTitle>Mot de passe</CardTitle>
              </div>
              <CardDescription>
                Le changer ferme les autres sessions — utile sur téléphone
                partagé.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
                <FormulaireMotDePasse />
                <aside
                  aria-label="Bon à savoir"
                  className="h-fit overflow-hidden rounded-xl border bg-card shadow-sm"
                >
                  <div className="flex items-center gap-2 border-b px-5 py-3.5">
                    <ShieldCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-[13px] font-semibold">Bon à savoir</p>
                  </div>
                  <ul className="flex flex-col gap-3.5 px-5 py-4">
                    <li className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                      Au moins 8 caractères, différent de vos autres comptes.
                    </li>
                    <li className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                      Le changer ferme les autres sessions : prévoyez de
                      reconnecter vos autres téléphones.
                    </li>
                  </ul>
                  <p className="mx-5 mb-2 flex gap-2.5 rounded-lg border border-primary/25 bg-primary/[0.07] px-3 py-2.5 text-xs leading-relaxed">
                    <UsersIcon className="mt-0.5 size-4 shrink-0 text-primary-foreground" />
                    <span>
                      <span className="font-semibold">Téléphone partagé ?</span>{" "}
                      <span className="text-muted-foreground">
                        Si quelqu’un d’autre a ouvert votre compte avec votre
                        session, changez le mot de passe pour couper son accès.
                      </span>
                    </span>
                  </p>
                  <p className="mx-5 mb-5 flex gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    <WifiOffIcon className="mt-0.5 size-4 shrink-0" />
                    Sans réseau, le changement attend le retour du réseau
                    et la file de S8.
                  </p>
                </aside>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="titre-synchro" className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
              <RefreshCwIcon />
            </span>
            <div>
              <h2
                id="titre-synchro"
                className="text-sm font-semibold tracking-tight"
              >
                File et réseau
              </h2>
              <p className="text-xs text-muted-foreground">
                Où en sont vos données, sans chiffre inventé.
              </p>
            </div>
          </div>
          <Card>
            <CardContent>
              <SyncSection />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="titre-appareil" className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
              <SmartphoneIcon />
            </span>
            <div>
              <h2
                id="titre-appareil"
                className="text-sm font-semibold tracking-tight"
              >
                Cet appareil
              </h2>
              <p className="text-xs text-muted-foreground">
                Réglages du téléphone, jamais synchronisés.
              </p>
            </div>
          </div>
          <Card>
            <CardContent>
              <AppareilSection />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="titre-notifications" className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
              <BellIcon />
            </span>
            <div>
              <h2
                id="titre-notifications"
                className="text-sm font-semibold tracking-tight"
              >
                Notifications
              </h2>
              <p className="text-xs text-muted-foreground">
                Quels événements vous signalent, et comment.
              </p>
            </div>
          </div>
          <Card>
            <CardContent>
              <NotificationsSection />
            </CardContent>
          </Card>
        </section>
      </div>

      <p className="border-t border-dashed pt-4 text-xs leading-relaxed text-muted-foreground">
        Ni taux, ni plafond, ni promotion ici : ce sont des décisions du
        distributeur. Besoin d’aide ?{" "}
        <Link
          href="/clients/aide"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Ouvrir l’aide
        </Link>
        .
      </p>
    </div>
  );
}
