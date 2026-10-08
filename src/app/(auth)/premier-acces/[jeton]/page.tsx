import { Field, FieldGroup } from "@/components/ui/field";
import { AuthShell } from "@/components/auth-shell";
import { lirePremierAcces } from "@/lib/s1-comptes/staff";
import { PremierAccesForm } from "./premier-acces-form";

/**
 * /premier-acces/[jeton] — la personne créée par lien choisit elle-même son
 * mot de passe. Page PUBLIQUE (hors /admin : l'invité n'a pas de session).
 * Portée stricte : le lien n'ouvre aucune session et ne contourne pas la
 * 2FA — après ce choix, connexion normale email + mot de passe + TOTP.
 * Usage unique, 24 h, états d'échec explicites.
 */
export default async function PremierAccesPage({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;
  const acces = await lirePremierAcces(jeton);

  if (acces.statut === "INCONNU") {
    return (
      <AuthShell
        title="Lien inconnu"
        description="Ce lien de premier accès n'existe pas. Demandez un nouveau lien à votre administrateur."
      >
        <FieldGroup>
          <Field>
            <p className="text-xs text-muted-foreground">
              Vérifiez que l&apos;adresse a été copiée en entier.
            </p>
          </Field>
        </FieldGroup>
      </AuthShell>
    );
  }

  if (acces.statut === "CONSOMME") {
    return (
      <AuthShell
        title="Lien déjà utilisé"
        description="Ce lien a déjà servi à choisir un mot de passe. Connectez-vous avec vos identifiants."
      >
        <FieldGroup>
          <Field>
            <p className="text-xs text-muted-foreground">
              En cas de perte de votre mot de passe, contactez votre
              administrateur.
            </p>
          </Field>
        </FieldGroup>
      </AuthShell>
    );
  }

  if (acces.statut === "EXPIRE") {
    return (
      <AuthShell
        title="Lien expiré"
        description="Ce lien n'est plus valide (24 h). Demandez un nouveau lien à votre administrateur."
      >
        <FieldGroup>
          <Field>
            <p className="text-xs text-muted-foreground">
              Seul votre administrateur peut générer un nouveau lien.
            </p>
          </Field>
        </FieldGroup>
      </AuthShell>
    );
  }

  if (acces.statut === "REVOQUE") {
    return (
      <AuthShell
        title="Lien révoqué"
        description="Ce lien de premier accès a été révoqué par un administrateur : plus aucun mot de passe ne peut être choisi avec. Demandez un nouveau lien."
      >
        <FieldGroup>
          <Field>
            <p className="text-xs text-muted-foreground">
              Seul un administrateur technique ou un administrateur principal
              validé peut générer un nouveau lien.
            </p>
          </Field>
        </FieldGroup>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choisissez votre mot de passe"
      description={
        acces.role === "AGENT"
          ? `Compte ${acces.email} — ce lien à usage unique ne sert qu'à choisir votre mot de passe. Ensuite, connectez-vous avec votre email et ce mot de passe.`
          : `Compte ${acces.email} — ce lien à usage unique ne sert qu'à choisir votre mot de passe. Ensuite, connectez-vous : le second facteur sera exigé.`
      }
    >
      <PremierAccesForm jeton={jeton} />
    </AuthShell>
  );
}
