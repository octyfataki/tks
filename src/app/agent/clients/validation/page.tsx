import Link from "next/link";
import { headers } from "next/headers";
import { ArrowUpRightIcon } from "lucide-react";
import { asc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import {
  comptesClients,
  comptesStaff,
  piecesIdentiteClients,
} from "@/lib/db/schema/accounts";
import { aPermission } from "@/lib/authorizations/permissions";
import { cn } from "@/lib/utils";
import { joursAttente } from "@/components/clients/affichage-client";
import { FileValidation } from "@/components/clients/file-validation";
import { RafraichissementFile } from "@/components/clients/rafraichissement-file";
import { PermissionRefusee } from "@/components/permission-denied";

async function getConnectedAgent(): Promise<{ id: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const rows = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export default async function AgentClientAccountsValidationPage() {
  const agent = await getConnectedAgent();
  if (!agent || !(await aPermission(agent.id, "client.valider"))) {
    return (
      <PermissionRefusee
        titre="Validation réservée"
        detail="Seuls les agents autorisés à valider les comptes clients peuvent trancher ici."
        action="Demandez à l'administrateur principal la permission « client.valider »."
      />
    );
  }

  const rawRows = await db
    .select({
      id: comptesClients.id,
      email: comptesClients.email,
      telephone: comptesClients.telephone,
      status: comptesClients.etat,
      rejectionReason: comptesClients.refuseMotif,
      createdAt: comptesClients.createdAt,
      name: user.name,
    })
    .from(comptesClients)
    .leftJoin(user, eq(user.id, comptesClients.betterAuthUserId))
    .where(
      inArray(comptesClients.etat, ["EN_ATTENTE_VALIDATION", "REFUSE"]),
    )
    .orderBy(asc(comptesClients.createdAt));

  const accountIds = rawRows.map((row) => row.id);
  const rawDocuments =
    accountIds.length > 0
      ? await db
          .select({
            id: piecesIdentiteClients.id,
            clientAccountId: piecesIdentiteClients.compteClientId,
            documentType: piecesIdentiteClients.typePiece,
            mime: piecesIdentiteClients.mime,
          })
          .from(piecesIdentiteClients)
          .where(inArray(piecesIdentiteClients.compteClientId, accountIds))
          .orderBy(asc(piecesIdentiteClients.createdAt))
      : [];
  const latestDocumentByAccount = new Map(
    rawDocuments.map((document) => [
      document.clientAccountId,
      {
        id: document.id,
        typePiece: document.documentType,
        mime: document.mime,
      },
    ]),
  );

  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const now = Date.now();
  const oldestWaitDays =
    rawRows.length > 0
      ? joursAttente(rawRows[0].createdAt, now)
      : 0;

  const rows = rawRows
    .map((row) => ({
      id: row.id,
      nom: row.name,
      email: row.email,
      telephone: row.telephone,
      etat: row.status,
      motifRefus: row.rejectionReason,
      inscritLe: row.createdAt,
      piece: latestDocumentByAccount.get(row.id) ?? null,
    }))
    .sort((a, b) => {
      const statusRank = (status: string) => (status === "REFUSE" ? 1 : 0);
      return (
        statusRank(a.etat) - statusRank(b.etat) ||
        a.inscritLe.getTime() - b.inscritLe.getTime()
      );
    });

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
          {rows.length === 0
            ? "File vide : aucun compte en attente."
            : `${rows.length} compte${rows.length > 1 ? "s" : ""} en attente, les plus anciens d'abord. `}
          Un compte non validé ne peut rien faire : ni dossier, ni solde, ni
          commande.
        </p>
      </div>

      {rows.length === 0 ? (
        <>
          <RafraichissementFile />
          <div className="rounded-xl border bg-card p-6 text-center">
            <p className="text-sm font-medium">Aucun compte en attente</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Retour à la{" "}
              <Link
                href="/agent/clients"
                className="underline underline-offset-4"
              >
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
              oldestWaitDays >= 7 ? "bg-destructive" : "bg-amber-600",
            )}
          />
          <span className="font-medium">
            {rows.length} compte{rows.length > 1 ? "s" : ""} en attente
          </span>
          <span className="text-muted-foreground">
            — plus ancien{" "}
            {oldestWaitDays === 0
              ? "arrivé aujourd'hui"
              : oldestWaitDays === 1
                ? "arrivé hier"
                : `en attente depuis ${oldestWaitDays} jours`}{" "}
            · pièce d&apos;identité exigée.
          </span>
          <Link
            href="/agent/clients"
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
              {rows.length}
              <ArrowUpRightIcon className="ml-1 inline size-3.5 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
            </span>
          </Link>
        </div>
      )}

      {rows.length > 0 ? (
        <>
          <RafraichissementFile />
          <FileValidation
            lignes={rows}
            maintenant={now}
            listeComptesHref="/agent/clients"
          />
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
