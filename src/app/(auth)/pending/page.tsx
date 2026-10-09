"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  IdCard,
  Phone,
  Scissors,
  Store,
  UserRound,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";

// S1 : page d'attente pleine — pas un bloc de formulaire. Le client vient
// d'envoyer sa demande (ou revient connecté sans récapitulatif local) : il
// voit son ticket en grand, le parcours réel en 4 étapes, et ce qu'on
// attend de lui au comptoir. Le récapitulatif vient de la session
// (clé `tks-inscription` posée par /sign-up, jamais le mot de passe).
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
  statut: "faite" | "encours" | "avenir";
};

export default function PendingPage() {
  // Initialisé une fois côté client : pas d'effet, pas de rendu en cascade.
  // En prérendu serveur, le récapitulatif est vide puis hydraté.
  const [recap] = useState<Recap>(() => lireRecap());

  const aRecap = Boolean(recap.name || recap.email || recap.telephone);
  const pieceDeposee =
    recap.piece !== undefined && recap.piece !== "comptoir";
  const dateEnvoi =
    recap.at !== undefined
      ? new Date(recap.at).toLocaleDateString("fr-CD", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const etapes: Etape[] = [
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
      <header className="relative z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="TKS — accueil" className="inline-flex">
            <BrandLogo height={28} />
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "ghost" }) + " text-xs"}
          >
            Retour à la connexion
          </Link>
        </div>
      </header>

      <main className="tks-ticket-enter relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-primary">Demande reçue</p>
          <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Votre compte attend sa validation
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Gardez ce ticket : présentez votre pièce d&apos;identité au
            comptoir, ou attendez qu&apos;un humain du distributeur la vérifie.
            Tant que le compte n&apos;est pas validé puis rattaché, il ne peut
            rien faire — ni dossier, ni solde, ni commande, pas même prépayée.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section
            aria-label="Ticket de demande"
            className="overflow-hidden rounded-3xl border bg-card shadow-sm"
          >
            <div className="border-b border-dashed p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Ticket de demande
                </p>
                <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  En attente
                </span>
              </div>
              <p className="font-heading mt-2 text-2xl font-semibold tracking-tight">
                {recap.name || "Demande en cours de vérification"}
              </p>
              {aRecap ? (
                <dl className="mt-4 flex flex-col gap-3 text-sm">
                  {recap.email ? (
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <UserRound className="size-4" />
                      </span>
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Email de connexion
                        </dt>
                        <dd className="font-medium">{recap.email}</dd>
                      </div>
                    </div>
                  ) : null}
                  {recap.telephone ? (
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Phone className="size-4" />
                      </span>
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Téléphone
                        </dt>
                        <dd className="font-medium">{recap.telephone}</dd>
                      </div>
                    </div>
                  ) : null}
                  {dateEnvoi ? (
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Demande envoyée
                        </dt>
                        <dd className="font-medium">Le {dateEnvoi}</dd>
                      </div>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Connectez-vous avec votre email pour voir l&apos;avancement
                  de votre demande.
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

            <div className="flex items-start gap-3 p-5 sm:p-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                {pieceDeposee ? (
                  <IdCard className="size-5" />
                ) : (
                  <Store className="size-5" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {pieceDeposee
                    ? `Pièce reçue : ${recap.piece}`
                    : "Pièce à présenter au comptoir"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Sans pièce vue par un humain, le compte ne sera pas validé.
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-6">
            <section
              aria-label="Où en est votre demande"
              className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6"
            >
              <h2 className="text-sm font-semibold">
                Où en est votre demande
              </h2>
              <ol className="relative mt-4 flex flex-col gap-5">
                <span
                  aria-hidden
                  className="absolute top-3 bottom-3 left-2.5 w-px bg-border"
                />
                {etapes.map((etape) => (
                  <li
                    key={etape.titre}
                    aria-current={
                      etape.statut === "encours" ? "step" : undefined
                    }
                    className="relative flex items-start gap-3"
                  >
                    {etape.statut === "faite" ? (
                      <span className="relative flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : etape.statut === "encours" ? (
                      <span className="relative flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card">
                        <span className="size-1.5 rounded-full bg-primary" />
                      </span>
                    ) : (
                      <span className="relative size-5 shrink-0 rounded-full border bg-card" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{etape.titre}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {etape.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section
              aria-label="Ce qu'on attend de vous"
              className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6"
            >
              <h2 className="text-sm font-semibold">Ce qu&apos;on attend de vous</h2>
              <ul className="mt-3 flex flex-col gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-primary"
                    strokeWidth={3}
                  />
                  Une pièce d&apos;identité avec photo, à montrer au comptoir
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
              <Link
                href="/sign-in"
                className={buttonVariants({ variant: "default" }) + " mt-4 w-full"}
              >
                Retour à la connexion
              </Link>
            </section>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t bg-background/80 backdrop-blur">
        <p className="mx-auto w-full max-w-5xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          Un compte non validé ne voit aucun dossier et aucun solde. La
          validation dit que vous êtes client ; le rattachement, fait ensuite
          par le distributeur, dit que vous êtes ce client-là.
        </p>
      </footer>
    </div>
  );
}
