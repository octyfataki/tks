import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import {
  ArrowLeftIcon,
  FingerprintIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import {
  comptesStaff,
  facteurs2faAdmin,
  peutModifierAdmin,
  premiersAccesAdmin,
} from "@/lib/db/schema/s1-comptes";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FormulaireAppareil } from "./formulaire-appareil";
import { FormulaireCoordonnees } from "./formulaire-coordonnees";
import { SectionModifiable } from "./section-modifiable";
import { InterrupteurEtat } from "../interrupteur-etat";
import { BoutonRevocation } from "./bouton-revocation";

const LIBELLE_ROLE: Record<string, string> = {
  ADMIN_PRINCIPAL: "Administrateur principal",
  ADMIN_TECHNIQUE: "Administrateur technique",
};

const ROLES_LISTE = ["ADMIN_PRINCIPAL", "ADMIN_TECHNIQUE"];

function initiales(nom: string): string {
  const lettres = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join("");
  return lettres || "AD";
}

function dateLongue(valeur: Date): string {
  return valeur.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Lien de premier accès en attente : non consommé et non expiré. */
function premierAccesEnAttente(
  acces: { expireLe: Date; consommeLe: Date | null } | undefined,
  maintenant: number = Date.now(),
): boolean {
  if (!acces || acces.consommeLe !== null) return false;
  return acces.expireLe.getTime() > maintenant;
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
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          {aide}
        </p>
      </div>
    </div>
  );
}

/**
 * /admin/list/[id] — Fiche d'un compte d'administration.
 * Bandeau registre (identité + matricule) puis zones à crayon : chaque
 * carte corrige ses propres informations — coordonnées (nom, téléphone),
 * sécurité (étiquette de l'appareil 2FA). Email, rôle, état et secrets
 * verrouillés : rôle immuable (S2 : révocation + recréation), email =
 * identifiant de confiance, 2FA et mot de passe jamais visibles par un
 * administrateur technique (S2-04). Traçabilité et accès en lecture.
 * Un identifiant inconnu ou hors administration rend 404.
 */
export default async function ProfilAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const entetes = await headers();
  const session = await auth.api.getSession({ headers: entetes });
  const userId = session?.user?.id;

  // Le créateur se résout en seconde requête : les jointures aliasées sur
  // la même table font s'effondrer le typage Drizzle en never[].
  const lignes = await db
    .select({
      id: comptesStaff.id,
      email: comptesStaff.email,
      telephone: comptesStaff.telephone,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
      creePar: comptesStaff.creePar,
      createdAt: comptesStaff.createdAt,
      revokedAt: comptesStaff.revokedAt,
      suspendedAt: comptesStaff.suspendedAt,
      betterAuthUserId: comptesStaff.betterAuthUserId,
      nom: user.name,
    })
    .from(comptesStaff)
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
    .where(eq(comptesStaff.id, id))
    .limit(1);

  const compte = lignes[0];
  if (!compte || !ROLES_LISTE.includes(compte.role)) notFound();

  const nom =
    compte.nom?.trim() || compte.email.split("@")[0] || "Administrateur";
  const matricule = compte.id.slice(0, 8).toUpperCase();

  const lignesCreateur = compte.creePar
    ? await db
        .select({ email: comptesStaff.email, nom: user.name })
        .from(comptesStaff)
        .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
        .where(eq(comptesStaff.id, compte.creePar))
        .limit(1)
    : [];
  const createur = compte.creePar
    ? (lignesCreateur[0]?.nom?.trim() ||
      lignesCreateur[0]?.email ||
      "Compte supprimé")
    : "Système (bootstrap)";

  const facteurs = await db
    .select({
      nomAppareil: facteurs2faAdmin.nomAppareil,
      actif: facteurs2faAdmin.actif,
      createdAt: facteurs2faAdmin.createdAt,
    })
    .from(facteurs2faAdmin)
    .where(eq(facteurs2faAdmin.compteStaffId, compte.id))
    .limit(1);
  const facteur = facteurs[0];

  const acces = await db
    .select({
      expireLe: premiersAccesAdmin.expireLe,
      consommeLe: premiersAccesAdmin.consommeLe,
    })
    .from(premiersAccesAdmin)
    .where(eq(premiersAccesAdmin.compteStaffCible, compte.id))
    .orderBy(desc(premiersAccesAdmin.createdAt))
    .limit(1);
  const dernierAcces = acces[0];
  const accesEnAttente = premierAccesEnAttente(dernierAcces);

  // Correction par zone : même autorisation que la création — administrateur
  // technique ou principal, toujours VALIDE — et jamais sur un compte
  // révoqué (définitif). Le titulaire peut retoucher son propre affichage ;
  // la révocation, elle, reste interdite sur soi-même (garde du composant).
  const lignesMoi = userId
    ? await db
        .select({
          id: comptesStaff.id,
          role: comptesStaff.role,
          etat: comptesStaff.etat,
        })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
        .limit(1)
    : [];
  const moi = lignesMoi[0];
  const autorise = !!moi && peutModifierAdmin(moi.role, moi.etat);
  const valide = compte.etat === "VALIDE";
  const suspendu = compte.etat === "SUSPENDU";
  const peutModifier = autorise && valide;
  const motifFiche = !autorise
    ? "Lecture seule : votre compte ne peut pas modifier cette fiche."
    : suspendu
      ? "Compte suspendu : lever la suspension pour corriger."
      : "Compte révoqué : définitif, aucune correction.";
  const estMoi = !!moi && moi.id === compte.id;

  const lectureSecurite = (
    <div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs">Second facteur (application d&apos;authentification)</p>
        {!facteur ? (
          <Badge variant="outline">Non configuré</Badge>
        ) : facteur.actif ? (
          <Badge variant="secondary">Actif</Badge>
        ) : (
          <Badge variant="destructive">Remplacé</Badge>
        )}
      </div>
      {facteur ? (
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Appareil
            </dt>
            <dd className="mt-0.5 text-sm">{facteur.nomAppareil}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Enregistré le
            </dt>
            <dd className="mt-0.5 text-sm">
              {dateLongue(facteur.createdAt)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Obligatoire pour un administrateur principal ou technique,
          jamais par SMS. Le secret n&apos;est jamais affiché.
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
        <p className="text-xs">Lien de premier accès</p>
        {accesEnAttente ? (
          <Badge variant="outline">En attente</Badge>
        ) : dernierAcces ? (
          <Badge variant="secondary">Consommé</Badge>
        ) : (
          <Badge variant="outline">Aucun</Badge>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <Link
        href="/admin/list"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
      >
        <ArrowLeftIcon />
        Retour à la liste
      </Link>

      <header className="border-l-4 border-primary bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
          >
            {initiales(nom)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-semibold tracking-tight">{nom}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {compte.email}
              {compte.telephone ? ` · ${compte.telephone}` : null}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <FingerprintIcon className="size-3.5" />
              Matricule {matricule} · suivi depuis le{" "}
              {dateLongue(compte.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <Badge variant="outline">
              {LIBELLE_ROLE[compte.role] ?? compte.role}
            </Badge>
            <Badge variant={valide ? "secondary" : suspendu ? "default" : "destructive"}>
              {compte.etat}
            </Badge>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <SectionModifiable
            titre="Coordonnées"
            description="Nom et téléphone retouchables, y compris par un administrateur technique."
            peutModifier={peutModifier}
            motifVerrouille={motifFiche}
            cleRepli={`${nom}-${compte.telephone ?? ""}`}
            lecture={
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Nom affiché
                  </dt>
                  <dd className="mt-0.5 text-sm">{nom}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Téléphone contact
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {compte.telephone || "Non renseigné"}
                  </dd>
                </div>
              </dl>
            }
            formulaire={
              <FormulaireCoordonnees
                id={compte.id}
                nomInitial={nom}
                telephoneInitial={compte.telephone ?? ""}
              />
            }
          />
          <div className="mt-3 flex flex-col gap-2">
            <LigneVerrouillee
              icone={MailIcon}
              etiquette="Adresse email"
              valeur={compte.email}
              aide="Identifiant de connexion : la confiance passe par l&apos;email, il ne se change pas ici."
            />
            <LigneVerrouillee
              icone={ShieldCheckIcon}
              etiquette="Rôle"
              valeur={LIBELLE_ROLE[compte.role] ?? compte.role}
              aide="Immuable : tout changement passe par révocation + recréation tracées."
            />
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border bg-card p-4 sm:p-5">
            <SectionModifiable
              titre="Sécurité"
              description="Étiquette de l'appareil retouchable ; le secret du second facteur n'est jamais affiché."
              peutModifier={peutModifier && !!facteur}
              motifVerrouille={
                !peutModifier
                  ? motifFiche
                  : "Aucun appareil déclaré : l'enregistrement se fait à la première connexion."
              }
              cleRepli={facteur?.nomAppareil ?? ""}
              lecture={lectureSecurite}
              formulaire={
                facteur ? (
                  <FormulaireAppareil
                    id={compte.id}
                    nomAppareilInitial={facteur.nomAppareil}
                  />
                ) : null
              }
            />
          </section>

          <section className="rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-medium">Traçabilité</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Créé par
                </dt>
                <dd className="mt-0.5 text-sm">{createur}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Compte créé le
                </dt>
                <dd className="mt-0.5 text-sm">
                  {dateLongue(compte.createdAt)}
                </dd>
              </div>
              {compte.revokedAt ? (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Révoqué le
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {dateLongue(compte.revokedAt)}
                  </dd>
                </div>
              ) : null}
              {compte.suspendedAt && suspendu ? (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Suspendu le
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {dateLongue(compte.suspendedAt)}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <PhoneIcon className="size-3" />
                  Téléphone déclaré
                </dt>
                <dd className="mt-0.5 text-sm">
                  {compte.telephone || "Non renseigné"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-destructive/30 bg-card p-4 sm:p-5">
            <h2 className="text-sm font-medium">Accès au compte</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {estMoi
                ? "Votre propre compte : la suspension est impossible."
                : "La suspension est réversible : le compte ne se connecte plus, la levée reste possible."}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs">
                État actuel : <span className="font-medium">{compte.etat}</span>
              </p>
              <InterrupteurEtat
                id={compte.id}
                nom={nom}
                etat={suspendu ? "SUSPENDU" : valide ? "VALIDE" : "REVOQUE"}
                desactive={estMoi}
                motifDesactive="Vous ne pouvez pas suspendre votre propre compte."
                sansRevocation
              />
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-xl border border-destructive bg-card p-4 sm:p-5">
        <h2 className="text-sm font-medium text-destructive">Zone dangereuse</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          La révocation est définitive : rouvrir un accès exige révocation +
          recréation tracées. Volontairement éloignée des gestes courants.
        </p>
        <div className="mt-3 flex items-center justify-end gap-2">
          <BoutonRevocation
            id={compte.id}
            nom={nom}
            revoque={!valide && !suspendu}
            desactive={estMoi}
            motifDesactive="Vous ne pouvez pas révoquer votre propre compte."
          />
        </div>
      </section>
    </div>
  );
}
