import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  FingerprintIcon,
  InfoIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Cachet } from "./cachet";
import { EtiquettesBadge } from "./etiquettes-badge";
import { FormulairesEtiquettes } from "./formulaires-etiquettes";
import { dateCourte, initiales, nomAffiche } from "./affichage-partage";
import { detailAttente, texteAttente } from "./affichage-client";
import {
  FormulaireAttesterComptoir,
  FormulaireRefuser,
  FormulaireRevoquer,
  FormulaireValider,
} from "./formulaires-decision";
import { FormulaireStatutPiece } from "./formulaire-statut-piece";
import { VignettePiece } from "./vignette-piece";
import {
  etatRevoquable,
  etatTranchable,
  pieceAValider,
  pieceARevoir,
  revuePiecePossible,
  type FicheClient,
  type PieceFicheClient,
} from "@/lib/s1-comptes/fiche-client";

function cachetEtat(etat: string): {
  encre: "attente" | "fait" | "expire" | "revoque";
  libelle: string;
} {
  if (etat === "VALIDE") return { encre: "fait", libelle: "Validé" };
  if (etat === "REFUSE") return { encre: "expire", libelle: "Refusé" };
  if (etat === "REVOQUE") return { encre: "revoque", libelle: "Révoqué" };
  return { encre: "attente", libelle: "En attente" };
}

function CachetPiece({ piece }: { piece: PieceFicheClient }) {
  if (piece.statutPiece === "ACCEPTEE") {
    return <Cachet encre="fait">Acceptée</Cachet>;
  }
  if (piece.statutPiece === "REFUSEE") {
    return <Cachet encre="revoque">Refusée</Cachet>;
  }
  if (piece.statutPiece === "RETIREE") {
    return <Cachet encre="expire">Retirée</Cachet>;
  }
  return <Cachet encre="attente">À revoir</Cachet>;
}

function Piece({
  piece,
  nom,
  compteDuPiece,
  peutStatuer,
}: {
  piece: PieceFicheClient;
  nom: string;
  compteDuPiece: string;
  peutStatuer: boolean;
}) {
  const estImage = piece.mime.startsWith("image/");
  return (
    <li className="rounded-lg border bg-muted/20">
      <a
        href={`/api/pieces-clients/${piece.id}`}
        target="_blank"
        rel="noreferrer"
        className="group flex items-start gap-4 p-3"
      >
        {estImage ? (
          <VignettePiece
            pieceId={piece.id}
            mime={piece.mime}
            alt={`Pièce ${piece.typePiece} de ${nom}`}
          />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded border bg-background text-muted-foreground">
            <FileTextIcon className="size-7" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="text-sm font-semibold tracking-tight">
              Pièce {piece.typePiece}
            </span>
            <CachetPiece piece={piece} />
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Déposée le {dateCourte(piece.deposeLe)}
            {piece.vueLe ? ` · vue le ${dateCourte(piece.vueLe)}` : " · pas encore vue"}
          </span>
          {piece.statutPiece === "REFUSEE" && piece.refusMotif ? (
            <span className="mt-2 block border-l-2 border-destructive/50 pl-2 text-xs leading-relaxed text-destructive">
              {piece.refusMotif}
            </span>
          ) : null}
          {peutStatuer ? (
            <span className="mt-1 block text-[11px] text-muted-foreground/70">
              {estImage ? "Ouvrez la pièce pour la juger" : "Ouvrez le PDF pour le juger"}
            </span>
          ) : null}
        </span>
      </a>
      {peutStatuer ? (
        <FormulaireStatutPiece
          compteId={compteDuPiece}
          pieceId={piece.id}
        />
      ) : null}
    </li>
  );
}

export function VueFicheClient({
  fiche,
  maintenant,
  listeHref,
  etiquettesActives,
  peutAnnoter,
}: {
  fiche: FicheClient;
  maintenant: number;
  listeHref: string;
  etiquettesActives: readonly string[];
  peutAnnoter: boolean;
}) {
  const nom = nomAffiche({ nom: fiche.nom, email: fiche.email });
  const cachet = cachetEtat(fiche.etat);
  const enAttente = fiche.etat === "EN_ATTENTE_VALIDATION";
  const tranchable = etatTranchable(fiche.etat);
  const piece = pieceAValider(fiche);
  const revuePossible = revuePiecePossible(fiche);
  const nbACrevoir = fiche.pieces.filter(pieceARevoir).length;
  const matricule = fiche.id.slice(0, 8).toUpperCase();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <Link
        href={listeHref}
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
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
              {fiche.email} · {fiche.telephone}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FingerprintIcon className="size-3.5" />
                Compte {matricule}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                Inscrit le {dateCourte(fiche.inscritLe)}
              </span>
              {enAttente ? (
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="size-3.5" />
                  {texteAttente(fiche.inscritLe, maintenant)}
                </span>
              ) : null}
            </p>
          </div>
          <div className="shrink-0">
            <Cachet encre={cachet.encre}>{cachet.libelle}</Cachet>
          </div>
        </div>
        {etiquettesActives.length > 0 ? (
          <div className="mt-3">
            <EtiquettesBadge codes={etiquettesActives} />
          </div>
        ) : null}
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-medium">Identité du compte</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Un compte est une connexion : le téléphone en est la clé. Le
            dossier financier vit ailleurs.
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">
                Nom affiché
              </dt>
              <dd className="mt-0.5 text-sm">{nom}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <PhoneIcon className="size-3" />
                Téléphone (clé du compte)
              </dt>
              <dd className="mt-0.5 text-sm tabular-nums">{fiche.telephone}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <MailIcon className="size-3" />
                Email
              </dt>
              <dd className="mt-0.5 truncate text-sm">{fiche.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Inscrit le
              </dt>
              <dd className="mt-0.5 text-sm tabular-nums">
                {dateCourte(fiche.inscritLe)}
                {enAttente
                  ? ` · ${detailAttente(fiche.inscritLe, maintenant)}`
                  : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Validé le
              </dt>
              <dd className="mt-0.5 text-sm tabular-nums">
                {fiche.valideLe ? dateCourte(fiche.valideLe) : "—"}
              </dd>
            </div>
            {fiche.refuseMotif ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">
                  Motif du refus
                </dt>
                <dd className="mt-0.5 text-sm">{fiche.refuseMotif}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <LockIcon className="mt-0.5 size-3.5 shrink-0" />
            <p>
              L&apos;identité du compte se corrige par le titulaire, jamais
              depuis cette fiche : aucun solde, aucune dette, aucun plafond
              n&apos;y figure (dossier financier S4).
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium">Pièce d&apos;identité</h2>
            {nbACrevoir > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                {nbACrevoir} à statuer
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Valider exige d&apos;avoir vu une pièce ; un compte sans pièce reste
            bloqué, sauf attestation au comptoir.
          </p>
          {fiche.pieces.length === 0 ? (
            <p
              role="note"
              className="mt-3 rounded-lg border border-amber-600/40 bg-amber-600/5 p-3 text-xs leading-relaxed"
            >
              <span className="font-semibold">
                Aucune pièce déposée pour l&apos;instant.
              </span>{" "}
              Le client la dépose depuis sa page d&apos;attente.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {fiche.pieces.map((p) => (
                <Piece
                  key={p.id}
                  piece={p}
                  nom={nom}
                  compteDuPiece={fiche.id}
                  peutStatuer={revuePossible && pieceARevoir(p)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-medium">Actions</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Chaque décision est journalisée : qui, quand, quel compte, sur
          quelle pièce.
        </p>

        {tranchable ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border bg-card p-3">
              {piece ? (
                <FormulaireValider compteId={fiche.id} pieceId={piece.id} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Validation bloquée : aucune pièce déposée. Validez au
                  comptoir si le client est là avec sa pièce.
                </p>
              )}
            </div>
            <div className="rounded-lg border bg-card p-3">
              <FormulaireRefuser compteId={fiche.id} />
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                Pas de dépôt numérique ? Attestez avoir vu la pièce en main
                propre.
              </p>
              <FormulaireAttesterComptoir compteId={fiche.id} />
            </div>
            <div className="rounded-lg border border-destructive/40 bg-card p-3">
              <p className="mb-2 text-xs font-semibold">Compte suspect ?</p>
              <FormulaireRevoquer compteId={fiche.id} />
            </div>
          </div>
        ) : fiche.etat === "REVOQUE" ? (
          <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs leading-relaxed">
            Compte révoqué : décision définitive, aucun geste possible.
            Rouvrir un accès passe par une réinscription.
          </p>
        ) : (
          <div
            className={cn(
              "mt-3 grid gap-4",
              etatRevoquable(fiche.etat) && "xl:grid-cols-2",
            )}
          >
            <p className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              Compte validé : il peut se connecter. Les pièces déposées
              depuis se tranchent sous chaque vignette, ci-dessus.
            </p>
            {etatRevoquable(fiche.etat) ? (
              <div className="rounded-lg border border-destructive/40 bg-card p-3">
                <p className="mb-2 text-xs font-semibold">
                  Compte devenu suspect ?
                </p>
                <FormulaireRevoquer compteId={fiche.id} />
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-medium">Annotations</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Repères posés à la main : ni note, ni score, ni calcul. Retirer
          ajoute l&apos;écriture inverse, tracée — rien n&apos;est effacé.
        </p>
        <div className="mt-3">
          <FormulairesEtiquettes
            compteId={fiche.id}
            actives={etiquettesActives}
            peutAnnoter={peutAnnoter}
          />
        </div>
      </section>

      <section className="rounded-xl border border-dashed bg-card p-4 sm:p-5">
        <h2 className="flex items-center gap-1.5 text-sm font-medium">
          <InfoIcon className="size-4 text-muted-foreground" />
          Profil client — différé (S4)
        </h2>
        <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Confirmer l&apos;accès au profil, modifier son statut de crédit ou
          son plafond demande des tables qui n&apos;existent pas encore
          (S4). Ces gestes ne sont volontairement pas proposés ici : pas de
          bouton sans effet. Ils apparaîtront sur cette fiche avec S4.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <li className="rounded-full border px-2.5 py-1">
            Confirmer l&apos;accès
          </li>
          <li className="rounded-full border px-2.5 py-1">
            Statut de crédit
          </li>
          <li className="rounded-full border px-2.5 py-1">Plafond</li>
        </ul>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldAlertIcon className="size-3.5" />
          Aucun solde, aucune dette affichés ici : séparation compte /
          dossier (GLOSSARY).
        </p>
      </section>
    </div>
  );
}
