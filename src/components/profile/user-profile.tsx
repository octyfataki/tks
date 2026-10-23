import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FingerprintIcon, ShieldCheckIcon } from "lucide-react";
import { BoutonCopierMatricule } from "./copy-registration-number-button";
import { BoutonDeconnexionAutres } from "./sign-out-other-devices-button";
import { PhotoProfilModifiable } from "./editable-profile-photo";
import {
  ListePiecesIdentite,
  type PieceIdentiteProfil,
} from "./identity-document-list";
import { SectionModifiable } from "@/components/editable-section";
import { PastilleBloc, type EtatBloc } from "./pastille";
import { dateHeure, dateLongue } from "./dates";
import { formaterAdresseSession, libelleAppareil } from "./session-label";
import { BlocActiviteRecente } from "./activity-panel";
import type { ActiviteRecente } from "@/lib/authorizations/activite";

export type CompteProfil =
  | { type: "CLIENT" }
  | {
      type: "STAFF";
      role: "ADMIN_PRINCIPAL" | "ADMIN_TECHNIQUE" | "AGENT";
      etat: "VALIDE" | "SUSPENDU" | "REVOQUE";
    };

export type ProfilClientRattache = {
  nom: string;
  statut: "EN_EVALUATION" | "PRIVILEGIE";
  adresse?: string | null;
};

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
  profilClient?: ProfilClientRattache | null;
  secondFacteurActif?: boolean | null;
  appareilSecondFacteur?: string | null;
  matricule?: string | null;
  creeLe?: Date | string | null;
  creePar?: string | null;
  sessions?: SessionEnCoursProfil[] | null;
  sessionActuelleId?: string | null;
  formulaireCoordonnees?: ReactNode;
  peutModifierCoordonnees?: boolean;
  motifCoordonneesVerrouillees?: string;
  cleCoordonnees?: string;
  formulaireSecondFacteur?: ReactNode;
  formulaireMotDePasse?: ReactNode;
  activite?: ActiviteRecente[] | null;
  journalAccessible?: boolean;
  piecesIdentite?: PieceIdentiteProfil[] | null;
  formulairePieceIdentite?: ReactNode;
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
  return "Non activé";
}

function Champ({ etiquette, valeur }: { etiquette: string; valeur: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{etiquette}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{valeur}</dd>
    </div>
  );
}

function TitreBloc({
  titre,
  description,
  pastille,
}: {
  titre: string;
  description: string;
  pastille?: EtatBloc;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{titre}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {pastille ? <PastilleBloc etat={pastille} /> : null}
    </div>
  );
}

export function ProfilUtilisateur({
  nom,
  email,
  telephone,
  avatarUrl,
  compte,
  profilClient,
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
  formulaireMotDePasse,
  activite,
  journalAccessible,
  piecesIdentite,
  formulairePieceIdentite,
  className,
}: ProfilUtilisateurProps) {
  const estStaff = compte.type === "STAFF";
  const estAgent = estStaff && compte.role === "AGENT";
  const profilClientAffiche = compte.type === "CLIENT" ? (profilClient ?? null) : null;
  const telephoneAffiche = telephone?.trim() ? telephone : null;
  const sessionsAffichees = sessions ?? null;
  const nbAutresSessions = sessionsAffichees
    ? sessionsAffichees.filter((s) => s.id !== sessionActuelleId).length
    : 0;
  const coordonneesModifiables = peutModifierCoordonnees ?? false;

  const reperes: ReactNode[] = [];
  if (matricule) {
    reperes.push(
      <span key="matricule" className="inline-flex items-center gap-1">
        <FingerprintIcon className="size-3.5" aria-hidden />
        Matricule {matricule}
        <BoutonCopierMatricule valeur={matricule} className="size-5" />
      </span>,
    );
  }
  if (creeLe) {
    reperes.push(<span key="cree">Compte créé le {dateLongue(creeLe)}</span>);
  }
  reperes.push(
    <span key="etat" className="inline-flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full", pointEtat(compte))} aria-hidden />
      {libelleEtat(compte)}
    </span>,
  );

  return (
    <section aria-label="Mon compte" className={cn("w-full min-w-0", className)}>
      <header className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-left">
          <PhotoProfilModifiable nom={nom} avatarUrl={avatarUrl} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="min-w-0 break-words text-xl font-semibold tracking-tight">{nom}</h1>
              <Badge variant="secondary" className="rounded-full">
                {libelleRole(compte)}
              </Badge>
            </div>
            <p className="mt-1 min-w-0 break-words text-sm text-muted-foreground">
              {email} · {precisionRole(compte)}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:justify-start">
              {reperes.map((repere, index) => (
                <span key={index} className="inline-flex items-center gap-1.5">
                  {index > 0 ? <span aria-hidden>·</span> : null}
                  {repere}
                </span>
              ))}
            </div>
            {estStaff ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Rôle immuable : tout changement passe par révocation et recréation
                tracées.
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <section aria-label="Coordonnées" className="rounded-xl border bg-card p-4 sm:p-5">
            <SectionModifiable
              titre="Coordonnées"
              description="Nom et téléphone retouchables. L'identifiant de connexion reste votre email : il ne se change pas ici."
              peutModifier={coordonneesModifiables}
              motifVerrouille={
                motifCoordonneesVerrouillees ?? "Lecture seule : la correction est indisponible."
              }
              cleRepli={cleCoordonnees}
              pastille={coordonneesModifiables ? "modifiable" : "lecture-seule"}
              lecture={
                <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Champ etiquette="Nom affiché" valeur={nom} />
                  <Champ
                    etiquette="Téléphone contact"
                    valeur={telephoneAffiche ?? "Non renseigné"}
                  />
                </dl>
              }
              formulaire={formulaireCoordonnees}
            />
          </section>

          {compte.type === "CLIENT" && piecesIdentite !== undefined ? (
            <section aria-label="Pièce d'identité" className="rounded-xl border bg-card p-4 sm:p-5">
              <TitreBloc
                titre="Pièce d'identité"
                description="Le document déposé pour vérifier la personne."
                pastille="lecture-seule"
              />
              <Separator className="mt-2" />
              {piecesIdentite === null || piecesIdentite.length === 0 ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Aucune pièce déposée pour l&apos;instant.
                </p>
              ) : (
                <ListePiecesIdentite pieces={piecesIdentite} />
              )}
              {formulairePieceIdentite ? (
                <div className="mt-1">{formulairePieceIdentite}</div>
              ) : null}
            </section>
          ) : null}

          {compte.type === "CLIENT" ? (
            <section aria-label="Profil client" className="rounded-xl border bg-card p-4 sm:p-5">
              <TitreBloc
                titre="Profil client"
                description="La fiche du client auquel ce compte est rattaché."
                pastille="lecture-seule"
              />
              <Separator className="mt-2" />
              {profilClientAffiche ? (
                <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Champ etiquette="Nom du profil" valeur={profilClientAffiche.nom} />
                  <Champ
                    etiquette="Statut"
                    valeur={
                      profilClientAffiche.statut === "PRIVILEGIE"
                        ? "Privilégié"
                        : "En évaluation"
                    }
                  />
                  <div className="sm:col-span-2">
                    <Champ
                      etiquette="Adresse"
                      valeur={
                        profilClientAffiche.adresse?.trim()
                          ? profilClientAffiche.adresse
                          : "Non renseignée"
                      }
                    />
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Aucun profil client rattaché : aucune donnée financière n&apos;est
                  visible tant que l&apos;accès n&apos;est pas confirmé.
                </p>
              )}
            </section>
          ) : null}

          {estAgent ? (
            <section aria-label="Mission de terrain" className="rounded-xl border bg-card p-4 sm:p-5">
              <TitreBloc
                titre="Mission de terrain"
                description="Ce que l&apos;agent de service fait sur le terrain."
                pastille="lecture-seule"
              />
              <Separator className="mt-2" />
              <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Champ etiquette="Fonction" valeur="Agent de service" />
                <Champ etiquette="Mode de travail" valeur="Hors-ligne capable" />
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Sert les commandes, encaisse au comptoir, valide les preuves de paiement.
              </p>
            </section>
          ) : null}

          {activite && activite.length > 0 ? (
            <BlocActiviteRecente activite={activite} journalAccessible={journalAccessible ?? false} />
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <section aria-label="Sécurité" className="rounded-xl border bg-card p-4 sm:p-5">
            <TitreBloc
              titre="Sécurité"
              description="Mot de passe, second facteur, sessions : ce qui protège ce compte."
              pastille={formulaireMotDePasse ? "modifiable" : "lecture-seule"}
            />
            <Separator className="mt-2" />
            {formulaireMotDePasse ? (
              <div className="mt-4">
                <p className="text-xs font-medium">Mot de passe</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Changer le mot de passe déconnecte les autres appareils.
                </p>
                <div className="mt-3">{formulaireMotDePasse}</div>
              </div>
            ) : null}
            {formulaireMotDePasse && formulaireSecondFacteur ? (
              <Separator className="my-4" />
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Second facteur</p>
              <Badge variant={secondFacteurActif ? "secondary" : "outline"}>
                {libelleSecondFacteur(secondFacteurActif)}
              </Badge>
            </div>
            {appareilSecondFacteur ? (
              <p className="mt-3 break-words text-xs text-muted-foreground">
                Appareil déclaré :{" "}
                <span className="font-medium text-foreground">{appareilSecondFacteur}</span>
              </p>
            ) : (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Optionnel : code à usage unique par SMS ou par email, exigé à
                chaque connexion quand il est actif. Le secret n&apos;est jamais affiché.
              </p>
            )}
            {formulaireSecondFacteur ? (
              <div className="mt-3">{formulaireSecondFacteur}</div>
            ) : null}
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheckIcon className="size-3.5" aria-hidden />
              Session à durée bornée, survit à la coupure.
            </p>
          </section>

          {creePar ? (
            <section aria-label="Traçabilité" className="rounded-xl border bg-card p-4 sm:p-5">
              <TitreBloc
                titre="Traçabilité"
                description="Qui a créé ce compte."
                pastille="lecture-seule"
              />
              <Separator className="mt-2" />
              <dl className="mt-4 grid gap-x-8 gap-y-4">
                <Champ etiquette="Créé par" valeur={creePar} />
              </dl>
            </section>
          ) : null}

          {sessionsAffichees ? (
            <section aria-label="Sessions en cours" className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
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
                  {sessionsAffichees.map((s) => {
                    const adresse = formaterAdresseSession(s.adresse);
                    return (
                      <div
                        key={s.id}
                        className="min-w-0 rounded-lg border px-3 py-2 text-xs"
                        title={s.appareil ?? "Appareil inconnu"}
                      >
                        <dt className="sr-only">Session</dt>
                        <dd className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate font-medium">
                            {libelleAppareil(s.appareil)}
                          </span>
                          {s.id === sessionActuelleId ? (
                            <Badge variant="secondary" className="shrink-0 rounded-full">
                              Cet appareil
                            </Badge>
                          ) : null}
                        </dd>
                        <dd className="mt-0.5 break-words text-muted-foreground tabular-nums">
                          {adresse ? `${adresse} · ` : ""}depuis le {dateHeure(s.creeLe)}
                          {" · "}expire le {dateHeure(s.expireLe)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
