import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import {
  comptesClients,
  piecesIdentiteClients,
} from "@/lib/db/schema/s1-comptes";
import { cn } from "@/lib/utils";
import { joursAttente } from "../affichage-client";
import { FileValidation } from "./file-validation";
import { RafraichissementFile } from "./rafraichissement-file";

/**
 * /admin/clients/validation — File des comptes clients à trancher (S1-03).
 *
 * Même dessin que le registre des comptes : bandeau de file avec ticket,
 * tableau dense, cachets d'état, lignes dépliables. Ici chaque ligne est
 * un compte bloqué : la ligne dépliée est le guichet — la pièce déposée
 * par le client (image ou PDF) à voir, puis les gestes : valider sur
 * pièce, refuser avec motif (réversible), attester au comptoir, révoquer
 * le compte suspect (définitif — la « suppression » de la file, sans
 * effacement physique : REVOQUE, journalisé). Les refusés restent
 * dans la file avec leur motif : un compte REFUSE peut toujours être
 * validé plus tard (GLOSSARY), sur sa pièce ou au comptoir. Les plus
 * anciens d'abord : personne ne reste coincé sans qu'on le voie. Sans
 * pièce déposée, valider sur pièce est impossible : le guichet le dit,
 * mais l'attestation au comptoir reste ouverte.
 *
 * Valider n'est pas rattacher : un compte validé non rattaché ne voit
 * toujours aucun dossier et aucun solde.
 */
export default async function ValidationComptesClientsPage() {
  const lignesBrutes = await db
    .select({
      id: comptesClients.id,
      email: comptesClients.email,
      telephone: comptesClients.telephone,
      etat: comptesClients.etat,
      motifRefus: comptesClients.refuseMotif,
      createdAt: comptesClients.createdAt,
      nom: user.name,
    })
    .from(comptesClients)
    .leftJoin(user, eq(user.id, comptesClients.betterAuthUserId))
    .where(
      inArray(comptesClients.etat, ["EN_ATTENTE_VALIDATION", "REFUSE"]),
    )
    .orderBy(asc(comptesClients.createdAt));

  const ids = lignesBrutes.map((ligne) => ligne.id);
  const piecesBrutes =
    ids.length > 0
      ? await db
          .select({
            id: piecesIdentiteClients.id,
            compteClientId: piecesIdentiteClients.compteClientId,
            typePiece: piecesIdentiteClients.typePiece,
            mime: piecesIdentiteClients.mime,
          })
          .from(piecesIdentiteClients)
          .where(inArray(piecesIdentiteClients.compteClientId, ids))
          .orderBy(asc(piecesIdentiteClients.createdAt))
      : [];
  const dernierePiece = new Map(
    piecesBrutes.map((piece) => [piece.compteClientId, piece]),
  );

  // Horloge lue une fois par requête (composant serveur) : stable pendant
  // le rendu.
  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const maintenant = Date.now();
  const plusAncien =
    lignesBrutes.length > 0
      ? joursAttente(lignesBrutes[0].createdAt, maintenant)
      : 0;

  const lignes = lignesBrutes
    .map((ligne) => ({
      id: ligne.id,
      nom: ligne.nom,
      email: ligne.email,
      telephone: ligne.telephone,
      etat: ligne.etat,
      motifRefus: ligne.motifRefus,
      inscritLe: ligne.createdAt,
      piece: dernierePiece.get(ligne.id) ?? null,
    }))
    // Les attentes d'abord, les refusés à revoir ensuite ; ancienneté
    // dans chaque groupe.
    .sort((a, b) => {
      const rang = (etat: string) => (etat === "REFUSE" ? 1 : 0);
      return (
        rang(a.etat) - rang(b.etat) ||
        a.inscritLe.getTime() - b.inscritLe.getTime()
      );
    });
  const enAttente = lignes.filter((ligne) => ligne.etat !== "REFUSE").length;
  const refuses = lignes.length - enAttente;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Accès · Comptes clients
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Validation
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {lignes.length === 0
            ? "File vide : aucun compte en attente."
            : `${lignes.length} compte${lignes.length > 1 ? "s" : ""} en attente, les plus anciens d'abord. `}
          Un compte non validé ne peut rien faire : ni dossier, ni solde, ni
          commande.
        </p>
      </div>

      {lignes.length === 0 ? (
        <>
          <RafraichissementFile />
          <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">Aucun compte en attente</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Retour à la{" "}
            <Link href="/admin/clients" className="underline underline-offset-4">
              liste des comptes
            </Link>
            .
          </p>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-card px-3 py-2 text-xs">
          <span
            aria-hidden
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              plusAncien >= 7 ? "bg-destructive" : "bg-amber-600",
            )}
          />
          <span className="font-medium">
            {lignes.length} compte{lignes.length > 1 ? "s" : ""} en attente
          </span>
          <span className="text-muted-foreground">
            — plus ancien{" "}
            {plusAncien === 0
              ? "arrivé aujourd'hui"
              : plusAncien === 1
                ? "arrivé hier"
                : `en attente depuis ${plusAncien} jours`}{" "}
            · pièce d&apos;identité exigée.
          </span>
          <Link
            href="/admin/clients"
            aria-label="Retour à la liste des comptes clients"
            className="group ml-auto inline-flex items-center overflow-hidden rounded-full border text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="py-1.5 pr-2 pl-3.5 text-xs font-medium">
              Liste des comptes
            </span>
            <span
              aria-hidden
              className="mx-1 border-l border-dashed border-border pr-1 pl-2 text-xs font-semibold tabular-nums"
            >
              {lignes.length}
              <ArrowUpRightIcon className="ml-1 inline size-3.5 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
            </span>
          </Link>
        </div>
      )}

      {lignes.length > 0 ? (
        <>
          <RafraichissementFile />
          <FileValidation lignes={lignes} maintenant={maintenant} />
        </>
      ) : null}

      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        Valider exige d&apos;avoir vu la pièce déposée par le client ; refuser
        exige un motif, montré au client, qui pourra être validé plus tard
        sans ressaisie. Un compte suspect se révoque définitivement avec un
        motif : aucune suppression physique, le compte passe en REVOQUE et
        sort de la file. Chaque décision est journalisée : qui, quand, quel
        compte, sur quelle pièce.
      </p>
    </div>
  );
}
