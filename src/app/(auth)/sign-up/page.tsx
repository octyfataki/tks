"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/password-input";
import { Input } from "@/components/ui/input";

// S1 (maquette non câblée) : inscription réservée aux clients, en une seule
// page — nom complet, email, téléphone, mot de passe — puis dépôt de la pièce
// d'identité juste après la soumission (second écran, même page /sign-up).
// Le compte créé est EN_ATTENTE_VALIDATION : la validation reste humaine,
// sur pièce vue par un humain (comptoir ou pièce déposée ici).
// Les infos saisies sont mémorisées en session (clé `tks-inscription`, sans le
// mot de passe) pour que /pending affiche le récapitulatif et l'avancement.
// Aucune auto-inscription staff : administrateur (bootstrap, ou création par
// un administrateur existant via `creerAdminPrincipal`) et agent de service
// (lien d'invitation /invite/[token]) ne passent jamais par /sign-up.
// Contrainte au câblage : le proxy bloque déjà `/api/auth/sign-up` en public,
// et le téléphone reste un simple contact non-unique (S4), jamais la clé du
// dossier (GLOSSARY, invariant de séparation).
const CLE_INSCRIPTION = "tks-inscription";
const VERSION_INSCRIPTION = 1;

function memoriserInscription(patch: Record<string, string | number>) {
  try {
    const brut = sessionStorage.getItem(CLE_INSCRIPTION);
    const actuel = brut
      ? (JSON.parse(brut) as { v?: number; data?: Record<string, string | number> })
      : undefined;
    if (actuel?.v !== VERSION_INSCRIPTION) {
      sessionStorage.setItem(
        CLE_INSCRIPTION,
        JSON.stringify({ v: VERSION_INSCRIPTION, data: {} }),
      );
    }
    const data =
      actuel?.v === VERSION_INSCRIPTION ? actuel.data! : {};
    sessionStorage.setItem(
      CLE_INSCRIPTION,
      JSON.stringify({ v: VERSION_INSCRIPTION, data: { ...data, ...patch } }),
    );
  } catch {
    // Stockage indisponible : la maquette continue sans récapitulatif.
  }
}

export default function SignUpPage() {
  const router = useRouter();
  const [etape, setEtape] = useState<"infos" | "piece">("infos");
  const [chargement, setChargement] = useState(false);

  const soumettreInfos = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      memoriserInscription({
        name: String(form.get("name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        telephone: String(form.get("telephone") ?? "").trim(),
        at: Date.now(),
      });
      setChargement(true);
      // Maquette : latence simulée pour rendre l'état de chargement visible.
      await new Promise((r) => setTimeout(r, 600));
      setChargement(false);
      setEtape("piece");
    },
    [],
  );

  const soumettrePiece = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const champ = e.currentTarget.elements.namedItem("piece");
      const fichier =
        champ instanceof HTMLInputElement ? champ.files?.[0] : undefined;
      memoriserInscription({ piece: fichier?.name ?? "comptoir" });
      setChargement(true);
      // Maquette : latence simulée pour rendre l'état de chargement visible.
      await new Promise((r) => setTimeout(r, 600));
      router.push("/pending");
    },
    [router],
  );

  const passerAuComptoir = useCallback(() => {
    memoriserInscription({ piece: "comptoir" });
    router.push("/pending");
  }, [router]);

  if (etape === "piece") {
    return (
      <AuthShell
        title="Pièce d'identité"
        description="Dernière étape : déposez votre pièce d'identité, ou présentez-la au comptoir. Sans pièce vue par un humain, le compte ne sera pas validé."
      >
        <form action="#" method="post" onSubmit={soumettrePiece}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="piece">Pièce d&apos;identité</FieldLabel>
              <Input
                id="piece"
                name="piece"
                type="file"
                accept="image/*"
                required
              />
              <FieldDescription>
                Photo compressée, plafonnée en taille. Elle sera conservée sur
                votre dossier et montrée à l&apos;humain qui validera le compte.
              </FieldDescription>
            </Field>
            <Field>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={chargement}
              >
                {chargement ? "Envoi…" : "Envoyer ma pièce d'identité"}
              </Button>
            </Field>
            <Field>
              <p className="text-xs text-muted-foreground">
                Je l&apos;ai sous la main plus tard ?{" "}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={passerAuComptoir}
                >
                  Je la présenterai au comptoir
                </button>
                .
              </p>
            </Field>
          </FieldGroup>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Inscription client"
      description="Tout se remplit ici, sur cette page. La pièce d'identité vous sera demandée juste après l'envoi du formulaire."
    >
      <form action="#" method="post" onSubmit={soumettreInfos}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nom complet</FieldLabel>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Nom complet ou appellation commerciale"
              required
              minLength={2}
            />
            <FieldDescription>
              C&apos;est sous ce nom que votre dossier sera désigné et confirmé
              à voix haute.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Adresse email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nom@exemple.cd"
              required
            />
            <FieldDescription>
              C&apos;est avec cet email que vous vous connecterez.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="telephone">Numéro de téléphone</FieldLabel>
            <Input
              id="telephone"
              name="telephone"
              type="tel"
              autoComplete="tel"
              placeholder="+243 …"
              required
            />
            <FieldDescription>
              Simple contact — ce n&apos;est pas votre identifiant de connexion.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <FieldDescription>8 caractères minimum.</FieldDescription>
          </Field>
          <Field>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={chargement}
            >
              {chargement ? "Création…" : "Créer mon compte client"}
            </Button>
          </Field>
          <Field>
            <p className="text-xs text-muted-foreground">
              Après l&apos;envoi, vous déposerez votre pièce d&apos;identité.
            </p>
          </Field>
          <Field>
            <p className="text-xs text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link href="/sign-in" className="underline underline-offset-4">
                Connexion
              </Link>
              .
            </p>
          </Field>
        </FieldGroup>
      </form>
    </AuthShell>
  );
}
