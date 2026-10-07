"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

// S1 (maquette non câblée) : écran d'attente après inscription. Il montre ce
// que le client a envoyé (récapitulatif lu en session, clé `tks-inscription`
// posée par /sign-up — jamais le mot de passe) et où en est sa demande :
// informations envoyées, pièce d'identité, validation humaine, rattachement
// au dossier. Le compte est EN_ATTENTE_VALIDATION : il ne peut rien faire —
// ni dossier, ni solde, ni commande, pas même prépayée. Le client peut se
// déconnecter : sa demande reste dans la file, et l'état avancera à la
// prochaine connexion.
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
    return JSON.parse(
      sessionStorage.getItem("tks-inscription") ?? "{}",
    ) as Recap;
  } catch {
    return {};
  }
}

export default function PendingPage() {
  // Initialisé une fois côté client : pas d'effet, pas de rendu en cascade.
  // En prérendu serveur, le récapitulatif est vide puis hydraté.
  const [recap] = useState<Recap>(() => lireRecap());

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

  return (
    <AuthShell
      title="Inscription bien reçue"
      description="Votre compte attend sa validation. Vous pouvez vous déconnecter : votre demande reste dans la file, et vous verrez ici son avancement à la prochaine connexion."
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Vos informations envoyées</FieldLabel>
          <dl className="w-full rounded-xl border bg-muted/40 p-3 text-xs leading-relaxed">
            <div className="flex justify-between gap-2 py-0.5">
              <dt className="text-muted-foreground">Nom complet</dt>
              <dd className="font-medium">{recap.name || "—"}</dd>
            </div>
            <div className="flex justify-between gap-2 py-0.5">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{recap.email || "—"}</dd>
            </div>
            <div className="flex justify-between gap-2 py-0.5">
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd className="font-medium">{recap.telephone || "—"}</dd>
            </div>
            <div className="flex justify-between gap-2 py-0.5">
              <dt className="text-muted-foreground">Pièce d&apos;identité</dt>
              <dd className="font-medium">
                {pieceDeposee ? recap.piece : "À présenter au comptoir"}
              </dd>
            </div>
            {dateEnvoi ? (
              <div className="flex justify-between gap-2 py-0.5">
                <dt className="text-muted-foreground">Envoyée le</dt>
                <dd className="font-medium">{dateEnvoi}</dd>
              </div>
            ) : null}
          </dl>
        </Field>
        <Field>
          <FieldLabel>Où en est votre demande</FieldLabel>
          <ol className="flex w-full flex-col gap-2 text-xs">
            <li className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span>Informations envoyées</span>
            </li>
            <li className="flex items-center gap-2">
              {pieceDeposee ? (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/50 bg-primary/10 font-semibold text-primary">
                  2
                </span>
              )}
              <span>
                {pieceDeposee
                  ? "Pièce d'identité reçue"
                  : "Pièce d'identité à présenter au comptoir"}
              </span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border font-semibold">
                3
              </span>
              <span>
                Validation par un humain du distributeur — en attente
              </span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border font-semibold">
                4
              </span>
              <span>Rattachement à votre dossier — en attente</span>
            </li>
          </ol>
        </Field>
        <Field>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Tant que le compte n&apos;est pas validé puis rattaché, il ne peut
            rien faire : ni dossier, ni solde, ni commande — pas même prépayée.
          </p>
        </Field>
        <Field>
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "outline" }) + " w-full"}
          >
            Se déconnecter
          </Link>
        </Field>
      </FieldGroup>
    </AuthShell>
  );
}
