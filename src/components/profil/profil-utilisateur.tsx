import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FingerprintIcon, LockIcon, MailIcon, PencilIcon, PhoneIcon, ShieldCheckIcon } from "lucide-react";
import { BoutonCopierMatricule } from "./bouton-copier-matricule";
import { BoutonDeconnexionAutres } from "./bouton-deconnexion-autres";
import { PhotoProfilModifiable } from "./photo-profil-modifiable";
import {
  ListePiecesIdentite,
  type PieceIdentiteProfil,
} from "./piece-identite-liste";
import { SectionModifiable } from "@/app/admin/list/[id]/section-modifiable";

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
      <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{valeur}</dd>
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
        <p className="mt-0.5 break-words text-sm">{valeur}</p>
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
  piecesIdentite,
  formulairePieceIdentite,
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
    <section aria-label="Mon compte" className={cn("w-full min-w-0", className)}>
      <header className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-left">
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
              <p className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground sm:justify-start">
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

          <dl className="grid flex-1 grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 sm:max-w-sm">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Matricule</dt>
              <dd className="mt-0.5 flex items-center gap-1 text-sm font-medium text-foreground">
                <span className="min-w-0 truncate">{matricule ?? "—"}</span>
                {matricule ? <BoutonCopierMatricule valeur={matricule} className="size-5 shrink-0" /> : null}
              </dd>
            </div>
            <Champ etiquette="Téléphone" valeur={telephoneAffiche ?? "Non renseigné"} />
            <Champ etiquette="Identifiant" valeur={email} />
            <Champ etiquette="Espace" valeur={espaceCompte(compte)} />
          </dl>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
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
                    <dd className="mt-0.5 break-words text-sm font-medium">{telephoneAffiche ?? "Non renseigné"}</dd>
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

          {compte.type === "CLIENT" && piecesIdentite !== undefined ? (
            <section aria-label="Pièce d'identité" className="rounded-xl border bg-card p-4 sm:p-5">
              <TitreCarte titre="Pièce d'identité" verrou="lecture seule : la validation se fait au comptoir" />
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

        <div className="flex min-w-0 flex-col gap-4">
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
                  {sessionsAffichees.map((s) => (
                    <div
                      key={s.id}
                      className="min-w-0 rounded-lg border px-3 py-2 text-xs"
                      title={s.appareil || "Appareil inconnu"}
                    >
                      <dt className="sr-only">Session</dt>
                      <dd className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-medium">
                          {(s.appareil || "Appareil inconnu").slice(0, 48)}
                        </span>
                        {s.id === sessionActuelleId ? (
                          <Badge variant="secondary" className="shrink-0 rounded-full">
                            Cet appareil
                          </Badge>
                        ) : null}
                      </dd>
                      <dd className="mt-0.5 break-words text-muted-foreground tabular-nums">
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
