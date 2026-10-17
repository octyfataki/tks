import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRightIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { comptesClients } from "@/lib/db/schema/s1-comptes";
import { aPermission } from "@/lib/s2-autorisations/autorisations";
import { nomAffiche } from "@/components/clients/affichage-partage";
import { joursAttente } from "@/components/clients/affichage-client";
import { BarreOutilsClients } from "@/components/clients/barre-outils-clients";
import { RegistreComptesClients } from "@/components/clients/registre-comptes-clients";
import { RafraichissementFile } from "@/components/clients/rafraichissement-file";
import { PaginationListe } from "@/app/admin/list/pagination-liste";
import { PermissionRefusee } from "@/components/permission-refusee";

const VALID_FILTERS = [
  "en-attente",
  "valide",
  "refuse",
  "revoque",
] as const;
const VALID_SORTS = ["anciens", "nom-az"] as const;

const ROWS_PER_PAGE = 10;

type AccountFilter = (typeof VALID_FILTERS)[number];

const STATUS_BY_FILTER: Record<AccountFilter, string> = {
  "en-attente": "EN_ATTENTE_VALIDATION",
  valide: "VALIDE",
  refuse: "REFUSE",
  revoque: "REVOQUE",
};

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

export default async function AgentClientAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; tri?: string; page?: string }>;
}) {
  const agent = await getConnectedAgent();
  if (!agent || !(await aPermission(agent.id, "client.valider"))) {
    return (
      <PermissionRefusee
        titre="Comptes clients réservés"
        detail="Seuls les agents autorisés à valider les comptes clients peuvent ouvrir ce registre."
        action="Demandez à l'administrateur principal la permission « client.valider »."
      />
    );
  }

  const query = await searchParams;
  const searchTerm = (query.q ?? "").trim().toLowerCase();
  const filter = (VALID_FILTERS as readonly string[]).includes(
    query.filtre ?? "",
  )
    ? (query.filtre as AccountFilter)
    : null;
  const sort = (VALID_SORTS as readonly string[]).includes(query.tri ?? "")
    ? (query.tri as (typeof VALID_SORTS)[number])
    : null;
  const isFiltered = searchTerm !== "" || filter !== null;

  const rawRows = await db
    .select({
      id: comptesClients.id,
      email: comptesClients.email,
      telephone: comptesClients.telephone,
      status: comptesClients.etat,
      createdAt: comptesClients.createdAt,
      validatedAt: comptesClients.valideLe,
      rejectionReason: comptesClients.refuseMotif,
      name: user.name,
    })
    .from(comptesClients)
    .leftJoin(user, eq(user.id, comptesClients.betterAuthUserId))
    .orderBy(desc(comptesClients.createdAt));

  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const now = Date.now();

  const pendingRows = rawRows.filter(
    (row) => row.status === "EN_ATTENTE_VALIDATION",
  );
  const oldestWaitDays = Math.max(
    0,
    ...pendingRows.map((row) => joursAttente(row.createdAt, now)),
  );

  const filteredRows = rawRows.filter((row) => {
    if (filter !== null && row.status !== STATUS_BY_FILTER[filter]) return false;
    if (searchTerm) {
      const name = (row.name?.trim() || row.email).toLowerCase();
      if (
        !name.includes(searchTerm) &&
        !row.email.toLowerCase().includes(searchTerm) &&
        !row.telephone.toLowerCase().includes(searchTerm)
      )
        return false;
    }
    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sort === "anciens") return a.createdAt.getTime() - b.createdAt.getTime();
    if (sort === "nom-az")
      return nomAffiche({ nom: a.name, email: a.email }).localeCompare(
        nomAffiche({ nom: b.name, email: b.email }),
        "fr",
      );
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const total = rawRows.length;
  const totalPages = Math.max(
    1,
    Math.ceil(sortedRows.length / ROWS_PER_PAGE),
  );
  const requestedPage = Math.floor(Number(query.page));
  const page =
    Number.isFinite(requestedPage) && requestedPage >= 1
      ? Math.min(requestedPage, totalPages)
      : 1;
  const preservedParams = new URLSearchParams();
  if (searchTerm) preservedParams.set("q", query.q?.trim() ?? "");
  if (filter) preservedParams.set("filtre", filter);
  if (sort) preservedParams.set("tri", sort);
  const preservedQuery = preservedParams.toString();
  const baseHref = preservedQuery
    ? `/agent/clients?${preservedQuery}`
    : "/agent/clients";

  const exportRows = sortedRows.map((row) => ({
    nom: nomAffiche({ nom: row.name, email: row.email }),
    email: row.email,
    telephone: row.telephone,
    etat: row.status,
    inscritLe: row.createdAt.toLocaleDateString("fr-FR"),
    attenteJours:
      row.status === "EN_ATTENTE_VALIDATION"
        ? String(joursAttente(row.createdAt, now))
        : "—",
    valideLe: row.validatedAt
      ? row.validatedAt.toLocaleDateString("fr-FR")
      : "—",
    motifRefus: row.rejectionReason ?? "—",
  }));

  const rows = sortedRows
    .slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)
    .map((row) => ({
      id: row.id,
      nom: row.name,
      email: row.email,
      telephone: row.telephone,
      etat: row.status,
      inscritLe: row.createdAt,
      valideLe: row.validatedAt,
      refuseMotif: row.rejectionReason,
    }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Accès
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Comptes clients
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {total === 0
            ? "Aucun compte pour le moment."
            : isFiltered
              ? `${sortedRows.length} sur ${total} compte${total > 1 ? "s" : ""}.`
              : `${total} compte${total > 1 ? "s" : ""}.`}{" "}
          Une connexion par ligne : le téléphone est la clé du compte. Le
          dossier financier vit ailleurs — ici aucun solde.
        </p>
      </div>

      {pendingRows.length === 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
          />
          <span>File de validation vide — aucun compte bloqué.</span>
          <Link
            href="/agent/clients/validation"
            className="ml-auto inline-flex items-center rounded-full border border-primary/50 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Voir la file
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-card px-3 py-2 text-xs">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-amber-600"
          />
          <span className="font-medium">
            {pendingRows.length} compte{pendingRows.length > 1 ? "s" : ""} en
            attente
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
            href="/agent/clients/validation"
            aria-label={`Ouvrir la file de validation, ${pendingRows.length} compte${pendingRows.length > 1 ? "s" : ""} en attente`}
            className="group ml-auto inline-flex items-center overflow-hidden rounded-full border border-primary/50 bg-transparent text-primary shadow-sm transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="py-1.5 pr-2 pl-3.5 text-xs font-medium">
              Ouvrir la file
            </span>
            <span
              aria-hidden
              className="h-4 w-px border-l border-dashed border-primary/40"
            />
            <span className="flex items-center gap-1 py-1.5 pr-3 pl-2 text-xs font-semibold tabular-nums">
              {pendingRows.length}
              <ArrowUpRightIcon className="size-3.5 transition-transform motion-safe:group-hover:-translate-y-px motion-safe:group-hover:translate-x-px" />
            </span>
          </Link>
        </div>
      )}

      <RafraichissementFile
        etiquette="Actualiser la liste"
        suivi="Liste"
        intervalleMs={30000}
      />

      <Suspense>
        <BarreOutilsClients exportLignes={exportRows} />
      </Suspense>

      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">
            {isFiltered
              ? "Aucun compte ne correspond aux filtres"
              : "Aucun compte client pour le moment"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isFiltered ? (
              <Link
                href="/agent/clients"
                className="underline-offset-4 hover:underline"
              >
                Réinitialiser les filtres
              </Link>
            ) : (
              "Les inscriptions des clients apparaîtront ici dès leur première connexion."
            )}
          </p>
        </div>
      ) : (
        <RegistreComptesClients
          lignes={rows}
          maintenant={now}
          page={page}
          totalPages={totalPages}
          ficheBaseHref="/agent/clients"
        />
      )}
      <PaginationListe page={page} totalPages={totalPages} hrefBase={baseHref} />
    </div>
  );
}
