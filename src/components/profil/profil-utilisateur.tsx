import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FingerprintIcon, LockIcon, MailIcon, PencilIcon, PhoneIcon, ShieldCheckIcon } from "lucide-react";
import { BoutonCopierMatricule } from "./bouton-copier-matricule";
import { BoutonDeconnexionAutres } from "./bouton-deconnexion-autres";
import { PhotoProfilModifiable } from "./photo-profil-modifiable";
import { SectionModifiable } from "@/app/admin/list/[id]/section-modifiable";

// Mon compte : affichage seul, piloté par la session.
// Parti pris (maquettes Hang Minh + Sara Smith) :
// - bandeau d'identité en deux zones : qui (avatar, nom, pastille de rôle,
//   ligne de suivi avec point d'état) puis repères (matricule, téléphone,
//   email, rôle), séparés par un filet vertical ;
// - cartes au titre souligné d'un filet, crayon visible mais désactivé
//   (lecture seule, jamais un cul-de-sac silencieux) ;
// - colonne de gauche large (coordonnées), colonne de droite empilée
//   (sécurité, mission, traçabilité), comme la seconde maquette.
// Vocabulaire : GLOSSARY (compte, dossier client, jamais shop / vente /
// réalisation). Affichage seul : aucune écriture directe (invariant 1).

export type CompteProfil =
  | { type: "CLIENT" }
  | {
      type: "STAFF";
      role: "ADMIN_PRINCIPAL" | "ADMIN_TECHNIQUE" | "AGENT";
      etat: "VALIDE" | "SUSPENDU" | "REVOQUE";
    };

export type DossierRattacheProfil = {
  nom: string;
  statut: "EN_EVALUATION" | "PRIVILEGIE";
  adresse?: string | null;
};

/** Session better-auth encore valide : appareil et adresse suffisent, jamais le secret. */
export type SessionEnCoursProfil = {
  id: string;
  appareil?: string | null;
  adresse?: string | null;
  creeLe: Date | string;
  expireLe: Date | string;
};

export type ProfilUtilisateurProps = {
  nom: string;
  email: string;
  telephone?: string | null;
  avatarUrl?: string | null;
  compte: CompteProfil;
  dossier?: DossierRattacheProfil | null;
  secondFacteurActif?: boolean | null;
  /** Étiquette de l'appareil déclaré, quand le second facteur est configuré. */
  appareilSecondFacteur?: string | null;
  /** Matricule court (8 premiers caractères de l'identifiant staff). */
  matricule?: string | null;
  /** Date de création du compte. */
  creeLe?: Date | string | null;
  /** Qui a créé le compte, libellé prêt à afficher. */
  creePar?: string | null;
  /** Sessions encore valides du compte connecté (vide = aucune). */
  sessions?: SessionEnCoursProfil[] | null;
  /** Identifiant de la session courante (marquée « Cet appareil »). */
  sessionActuelleId?: string | null;
  /** Zone de correction nom + téléphone (son propre compte, espace admin). */
  formulaireCoordonnees?: ReactNode;
  /** Correction autorisée (compte VALIDE, droits suffisants) ? */
  peutModifierCoordonnees?: boolean;
  /** Motif affiché quand le crayon est désactivé. */
  motifCoordonneesVerrouillees?: string;
  /** Change à chaque enregistrement : le formulaire repart des valeurs fraîches. */
  cleCoordonnees?: string;
  /** Activation du second facteur (carte Sécurité, espace admin). */
  formulaireSecondFacteur?: ReactNode;
  className?: string;
};

function libelleRole(compte: CompteProfil): string {
  if (compte.type === "CLIENT") return "Client";
  switch (compte.role) {
    case "ADMIN_PRINCIPAL":
      return "Administrateur principal";
    case "ADMIN_TECHNIQUE":
      return "Administrateur technique";
    case "AGENT":
      return "Agent de service";
  }
}

function precisionRole(compte: CompteProfil): string {
  if (compte.type === "CLIENT") return "Espace client";
  if (compte.role === "AGENT") return "Terrain";
  if (compte.role === "ADMIN_PRINCIPAL") return "Distributeur";
  return "Diagnostic";
}

function espaceCompte(compte: CompteProfil): string {
  if (compte.type === "CLIENT") return "Espace client";
  if (compte.role === "AGENT") return "Espace agent";
  return "Espace distributeur";
}

function libelleEtat(compte: CompteProfil): string {
  if (compte.type === "CLIENT") return "Compte client";
  switch (compte.etat) {
    case "VALIDE":
      return "Valide";
    case "SUSPENDU":
      return "Suspendu";
    case "REVOQUE":
      return "Révoqué";
  }
}

function pointEtat(compte: CompteProfil): string {
  if (compte.type === "CLIENT") return "bg-muted-foreground";
  if (compte.etat === "VALIDE") return "bg-emerald-500";
  if (compte.etat === "SUSPENDU") return "bg-amber-500";
  return "bg-destructive";
}

function libelleSecondFacteur(actif: boolean | null | undefined): string {
  if (actif === true) return "Actif";
  if (actif === false) return "À activer";
  return "Non vérifié";
}

function dateLongue(valeur: Date | string): string {
  const date = valeur instanceof Date ? valeur : new Date(valeur);
  if (Number.isNaN(date.getTime())) return String(valeur);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function dateHeure(valeur: Date | string): string {
  const date = valeur instanceof Date ? valeur : new Date(valeur);
  if (Number.isNaN(date.getTime())) return String(valeur);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Champ({ etiquette, valeur }: { etiquette: string; valeur: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{etiquette}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">{valeur}</dd>
    </div>
  );
}

function TitreCarte({ titre, verrou }: { titre: string; verrou: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">{titre}</h2>
        <span
          role="img"
          aria-label={`${titre} : ${verrou}`}
          title={verrou}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground"
        >
          <PencilIcon className="size-4" aria-hidden />
        </span>
      </div>
      <Separator className="mt-2" />
    </div>
  );
}

function LigneVerrouillee({
  icone: Icone,
  etiquette,
  valeur,
  aide,
}: {
  icone: typeof MailIcon;
  etiquette: string;
  valeur: string;
  aide: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-dashed bg-muted/40 p-3">
      <Icone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-medium">
          {etiquette}
          <LockIcon className="size-3 text-muted-foreground" aria-label="Verrouillé" />
        </p>
        <p className="mt-0.5 truncate text-sm">{valeur}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{aide}</p>
      </div>
    </div>
  );
}

export function ProfilUtilisateur({
  nom,
  email,
  telephone,
  avatarUrl,
  compte,
  dossier,
  secondFacteurActif,
  appareilSecondFacteur,
  matricule,
  creeLe,
  creePar,
  sessions,
  sessionActuelleId,
  formulaireCoordonnees,
  peutModifierCoordonnees,
  motifCoordonneesVerrouillees,
  cleCoordonnees,
  formulaireSecondFacteur,
  className,
}: ProfilUtilisateurProps) {
  const estStaff = compte.type === "STAFF";
  const estAgent = estStaff && compte.role === "AGENT";
  const estAdmin = estStaff && compte.role !== "AGENT";
  const dossierAffiche = compte.type === "CLIENT" ? (dossier ?? null) : null;
  const telephoneAffiche = telephone?.trim() ? telephone : null;
  const sessionsAffichees = sessions ?? null;
  const nbAutresSessions = sessionsAffichees
    ? sessionsAffichees.filter((s) => s.id !== sessionActuelleId).length
    : 0;

  return (
    <section aria-label="Mon compte" className={cn("w-full", className)}>
      <header className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <PhotoProfilModifiable nom={nom} avatarUrl={avatarUrl} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight">{nom}</h1>
                <Badge variant="secondary" className="rounded-full">
                  {libelleRole(compte)}
                </Badge>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {email} · {precisionRole(compte)}
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {matricule ? (
                  <span className="inline-flex items-center gap-1">
                    <FingerprintIcon className="size-3.5" aria-hidden />
                    Matricule {matricule}
                    <BoutonCopierMatricule valeur={matricule} className="size-5" />
                  </span>
                ) : null}
                {creeLe ? <span>Suivi depuis le {dateLongue(creeLe)}</span> : null}
                {!matricule && !creeLe ? <span>Mon compte</span> : null}
                <span aria-hidden>·</span>
                <span className={cn("size-1.5 rounded-full", pointEtat(compte))} aria-hidden />
                <span>{libelleEtat(compte)}</span>
              </p>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden sm:block" />
          <Separator className="sm:hidden" />

          <dl className="grid flex-1 grid-cols-1 gap-x-8 gap-y-3 min-[420px]:grid-cols-2 sm:max-w-sm">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Matricule</dt>
              <dd className="mt-0.5 flex items-center gap-1 text-sm font-medium text-foreground">
                <span className="truncate">{matricule ?? "—"}</span>
                {matricule ? <BoutonCopierMatricule valeur={matricule} className="size-5 shrink-0" /> : null}
              </dd>
            </div>
            <Champ etiquette="Téléphone" valeur={telephoneAffiche ?? "Non renseigné"} />
            <Champ etiquette="Identifiant" valeur={email} />
            <Champ etiquette="Espace" valeur={espaceCompte(compte)} />
          </dl>
        </div>
      </header>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section aria-label="Coordonnées" className="rounded-xl border bg-card p-4 sm:p-5">
            <SectionModifiable
              titre="Coordonnées"
              description="Nom et téléphone retouchables. L'identifiant et le rôle ne se changent pas ici."
              peutModifier={peutModifierCoordonnees ?? false}
              motifVerrouille={
                motifCoordonneesVerrouillees ?? "Lecture seule : la correction est indisponible."
              }
              cleRepli={cleCoordonnees}
              lecture={
                <>
    <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Champ etiquette="Nom affiché" valeur={nom} />
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                      <PhoneIcon className="size-3" aria-hidden />
                      Téléphone contact
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium">{telephoneAffiche ?? "Non renseigné"}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-col gap-2">
                  <LigneVerrouillee
                    icone={MailIcon}
                    etiquette="Adresse email"
                    valeur={email}
                    aide="Identifiant de connexion : la confiance passe par l'email, il ne se change pas ici."
                  />
                  <LigneVerrouillee
                    icone={ShieldCheckIcon}
                    etiquette="Rôle"
                    valeur={libelleRole(compte)}
                    aide={
                      estStaff
                        ? "Immuable : tout changement passe par révocation + recréation tracées."
                        : "Le compte client ne porte aucun pouvoir de distribution."
                    }
                  />
                </div>
                </>
              }
              formulaire={formulaireCoordonnees}
            />
          </section>

          {compte.type === "CLIENT" ? (
            <section aria-label="Dossier client" className="rounded-xl border bg-card p-4 sm:p-5">
              <TitreCarte titre="Dossier client" verrou="lecture seule : le rattachement se fait par un distributeur" />
              {dossierAffiche ? (
                <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Champ etiquette="Nom du dossier" valeur={dossierAffiche.nom} />
                  <Champ
                    etiquette="Statut"
                    valeur={dossierAffiche.statut === "PRIVILEGIE" ? "Privilégié" : "En évaluation"}
                  />
                  <div className="sm:col-span-2">
                    <Champ
                      etiquette="Adresse"
                      valeur={dossierAffiche.adresse?.trim() ? dossierAffiche.adresse : "Non renseignée"}
                    />
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Aucun dossier rattaché : aucun dossier ni solde n&apos;est visible tant que le
                  rattachement n&apos;est pas fait.
                </p>
              )}
            </section>
          ) : null}

          {estAgent ? (
            <section aria-label="Mission de terrain" className="rounded-xl border bg-card p-4 sm:p-5">
              <TitreCarte titre="Mission de terrain" verrou="lecture seule : la mission est définie par le distributeur" />
              <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Champ etiquette="Fonction" valeur="Agent de service" />
                <Champ etiquette="Mode de travail" valeur="Hors-ligne capable" />
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Sert les commandes, encaisse au comptoir, valide les preuves de paiement.
              </p>
            </section>
          ) : null}

          {estAdmin ? (
            <section aria-label="Administration" className="rounded-xl border bg-card p-4 sm:p-5">
              <TitreCarte titre="Administration" verrou="lecture seule : le pouvoir métier ne se change pas ici" />
              <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Champ
                  etiquette="Pouvoir métier"
                  valeur={
                    compte.role === "ADMIN_PRINCIPAL"
                      ? "Distributeur : taux, plafonds, promotions"
                      : "Diagnostic seul, action tracée"
                  }
                />
                <Champ etiquette="Second facteur" valeur={libelleSecondFacteur(secondFacteurActif)} />
              </dl>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <section aria-label="Sécurité" className="rounded-xl border bg-card p-4 sm:p-5">
            <TitreCarte titre="Sécurité" verrou="lecture seule : la sécurité se gère hors de cette fiche" />
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Connexion</p>
              <Badge variant="outline">Mot de passe</Badge>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Second facteur</p>
              <Badge variant={secondFacteurActif ? "secondary" : "outline"}>
                {libelleSecondFacteur(secondFacteurActif)}
              </Badge>
            </div>
            {appareilSecondFacteur ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Appareil déclaré :{" "}
                <span className="font-medium text-foreground">{appareilSecondFacteur}</span>
              </p>
            ) : estAdmin ? (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Obligatoire pour un administrateur principal ou technique, jamais par SMS. Le secret
                n&apos;est jamais affiché.
              </p>
            ) : null}
            {formulaireSecondFacteur ? (
              <div className="mt-3">{formulaireSecondFacteur}</div>
            ) : null}
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <FingerprintIcon className="size-3.5" aria-hidden />
              Session à durée bornée, survit à la coupure.
            </p>
          </section>

          {creeLe || creePar ? (
            <section aria-label="Traçabilité" className="rounded-xl border bg-card p-4 sm:p-5">
              <TitreCarte titre="Traçabilité" verrou="lecture seule : le journal ne se modifie pas" />
              <dl className="mt-4 grid gap-x-8 gap-y-4">
                {creePar ? <Champ etiquette="Créé par" valeur={creePar} /> : null}
                {creeLe ? <Champ etiquette="Compte créé le" valeur={dateLongue(creeLe)} /> : null}
              </dl>
            </section>
          ) : null}

          {sessionsAffichees ? (
            <section aria-label="Sessions en cours" className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Sessions en cours</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {sessionsAffichees.length === 0
                      ? "Aucune session active."
                      : `${sessionsAffichees.length} session${sessionsAffichees.length > 1 ? "s" : ""} active${sessionsAffichees.length > 1 ? "s" : ""}, cet appareil compris.`}
                  </p>
                </div>
                <BoutonDeconnexionAutres nbAutres={nbAutresSessions} />
              </div>
              <Separator className="mt-2" />
              {sessionsAffichees.length > 0 ? (
                <dl className="mt-4 flex flex-col gap-2">
                  {sessionsAffichees.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border px-3 py-2 text-xs"
                      title={s.appareil || "Appareil inconnu"}
                    >
                      <dt className="sr-only">Session</dt>
                      <dd className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {(s.appareil || "Appareil inconnu").slice(0, 48)}
                        </span>
                        {s.id === sessionActuelleId ? (
                          <Badge variant="secondary" className="shrink-0 rounded-full">
                            Cet appareil
                          </Badge>
                        ) : null}
                      </dd>
                      <dd className="mt-0.5 text-muted-foreground tabular-nums">
                        {s.adresse ? `${s.adresse} · ` : ""}depuis le {dateHeure(s.creeLe)}
                        {" · "}expire le {dateHeure(s.expireLe)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
