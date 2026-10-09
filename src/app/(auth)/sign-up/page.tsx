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
import { toast } from "@/components/ui/toast";
import { inscrireCompteClient } from "./actions";

// S1-01 (câblée) : inscription réservée aux clients, en une seule
// page — nom complet, email, téléphone, mot de passe — puis dépôt de la pièce
// d'identité juste après la soumission (second écran, même page /sign-up).
// La soumission crée réellement le compte en EN_ATTENTE_VALIDATION via la
// server action (utilisateur auth + ligne comptes_clients en transaction) :
// la validation reste humaine, sur pièce vue par un humain (comptoir ou
// pièce déposée ici). Aucune session n'est ouverte à l'inscription : le
// client se connecte ensuite et atterrit sur /pending.
// Les infos saisies sont mémorisées en session (clé `tks-inscription`, sans le
// mot de passe) pour que /pending affiche le récapitulatif et l'avancement.
// Aucune auto-inscription staff : administrateur (bootstrap, ou création par
// un administrateur existant via `creerAdminPrincipal`) et agent de service
// (lien d'invitation /invite/[token]) ne passent jamais par /sign-up.
// Le proxy bloque toujours `/api/auth/sign-up` en public : l'inscription ne
// passe jamais par le endpoint better-auth, seulement par la server action.
// Le téléphone est la clé métier unique du compte (refus de doublon) ; il
// reste un simple contact non-unique sur le dossier financier S4, jamais la
// clé du dossier (GLOSSARY, invariant de séparation).
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

// Identifiant généré sur l'appareil (S1-01) : stable pour toute la durée
// de la tentative — une inscription interrompue puis rejouée porte le même
// id et ne crée pas de doublon. Stocké avec le récapitulatif, jamais le
// mot de passe.
function obtenirIdInscription(): string | undefined {
  try {
    const brut = sessionStorage.getItem(CLE_INSCRIPTION);
    const actuel = brut
      ? (JSON.parse(brut) as { v?: number; data?: Record<string, string | number> })
      : undefined;
    const existant =
      actuel?.v === VERSION_INSCRIPTION ? actuel.data?.["id"] : undefined;
    if (typeof existant === "string" && existant.length > 0) return existant;
    const frais =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : undefined;
    if (frais) memoriserInscription({ id: frais });
    return frais;
  } catch {
    return undefined;
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
      const name = String(form.get("name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const telephone = String(form.get("telephone") ?? "").trim();
      const password = String(form.get("password") ?? "");
      setChargement(true);
      const resultat = await inscrireCompteClient({
        email,
        password,
        name,
        telephone,
        id: obtenirIdInscription(),
      });
      setChargement(false);
      if (!resultat.ok) {
        toast.add({
          type: "error",
          title: "Inscription refusée",
          description: resultat.erreur,
        });
        return;
      }
      memoriserInscription({ name, email, telephone, at: Date.now() });
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
