import { Badge } from "@/components/ui/badge";
import { lireTauxEnVigueur } from "@/lib/currencies/rates";
import {
  UNITS_PER_DOLLAR,
  isBelowOfficialRate,
  isNetwork,
  networkLabel,
  networkSlug,
} from "@/modules/pricing/price-record";
import {
  actorCanManagePriceGrid,
  readGridAt,
  readRecentChanges,
  type PriceLineNamed,
} from "@/modules/pricing/publish";
import { PaginationListe } from "../list/list-pagination";
import { PricingDenied } from "./denied";
import { NetworkCard } from "./network-card";
import { NETWORK_LOGOS } from "@/components/network-assets";
import { jourIso, officialRateOf, toEntry } from "./pricing-display";
import { RateNote } from "./rate-note";
import { RecentChangesTable, type LigneChangement } from "./recent-changes-table";
import { RecentChangesToolbar } from "./recent-changes-toolbar";

const LIGNES_PAR_PAGE = 10;

type FiltresChangements = {
  q?: string;
  reseau?: string;
  du?: string;
  au?: string;
  tri?: string;
  page?: string;
};

function jourValide(valeur: string | undefined): valeur is string {
  return valeur !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(valeur);
}

function ligneDeChangement(
  line: PriceLineNamed,
  previous: PriceLineNamed | null,
  rateCdf: number | null,
): LigneChangement | null {
  if (!isNetwork(line.network)) return null;
  const apres = toEntry(line, rateCdf);
  const avant = previous ? toEntry(previous, rateCdf) : null;
  return {
    id: line.id,
    network: line.network,
    reseau: networkLabel(line.network),
    slug: networkSlug(line.network),
    logo: NETWORK_LOGOS[line.network],
    jour: jourIso(line.effectiveAt),
    avant: avant?.amountLabel ?? null,
    apres: apres.amountLabel,
    equivalent: apres.equivalentLabel,
    echantillon: apres.sampleLabel,
    publieLe: apres.effectiveAtLabel,
    auteur: apres.authorLabel,
    sousLeTaux: isBelowOfficialRate(
      { amount: line.amount, currency: line.currency },
      rateCdf,
    ),
  };
}

export default async function PriceGridPage({
  searchParams,
}: {
  searchParams: Promise<FiltresChangements>;
}) {
  const acteur = await actorCanManagePriceGrid();
  if (!acteur) {
    return <PricingDenied />;
  }

  const filtres = await searchParams;
  const instant = new Date();
  const [entrees, taux, changements] = await Promise.all([
    readGridAt(instant),
    lireTauxEnVigueur(),
    readRecentChanges(),
  ]);

  const rateCdf = taux?.valeur ?? null;
  const officialRate = officialRateOf(taux);
  const sansPrix = entrees.filter((entree) => entree.price === null).length;

  const lignes = changements.flatMap(({ line, previous }) => {
    const ligne = ligneDeChangement(line, previous, rateCdf);
    return ligne ? [ligne] : [];
  });

  const recherche = (filtres.q ?? "").trim().toLowerCase();
  const reseauFiltre =
    filtres.reseau && isNetwork(filtres.reseau) ? filtres.reseau : null;
  const du = jourValide(filtres.du) ? filtres.du : null;
  const au = jourValide(filtres.au) ? filtres.au : null;
  const triAncien = filtres.tri === "anciens";

  const filtrees = lignes.filter((ligne) => {
    if (reseauFiltre !== null && ligne.network !== reseauFiltre) return false;
    if (recherche) {
      const texte = `${ligne.reseau} ${ligne.auteur}`.toLowerCase();
      if (!texte.includes(recherche)) return false;
    }
    if (du !== null && ligne.jour < du) return false;
    if (au !== null && ligne.jour > au) return false;
    return true;
  });
  const triees = triAncien ? [...filtrees].reverse() : filtrees;
  const filtreActif =
    recherche !== "" ||
    reseauFiltre !== null ||
    du !== null ||
    au !== null ||
    triAncien;

  const totalPages = Math.max(1, Math.ceil(triees.length / LIGNES_PAR_PAGE));
  const demandee = Number.parseInt(filtres.page ?? "1", 10);
  const page = Math.min(Math.max(1, Number.isNaN(demandee) ? 1 : demandee), totalPages);
  const debut = (page - 1) * LIGNES_PAR_PAGE;
  const visibles = triees.slice(debut, debut + LIGNES_PAR_PAGE);

  const parametres = new URLSearchParams();
  if (filtres.q?.trim()) parametres.set("q", filtres.q.trim());
  if (reseauFiltre !== null) parametres.set("reseau", reseauFiltre);
  if (du !== null) parametres.set("du", du);
  if (au !== null) parametres.set("au", au);
  if (triAncien) parametres.set("tri", "anciens");
  const hrefBase = parametres.size
    ? `/admin/pricing?${parametres.toString()}`
    : "/admin/pricing";

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <header>
        <Badge variant="outline">Tarifs</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Grille tarifaire
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Un dollar d&apos;airtime vaut {UNITS_PER_DOLLAR} unités ; le prix se
          fixe réseau par réseau. Depuis chaque carte, la saisie prend effet
          immédiatement et s&apos;ajoute à l&apos;historique : les commandes
          déjà passées conservent le leur.
        </p>
      </header>

      {sansPrix > 0 ? (
        <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          {sansPrix === 1
            ? "Un réseau n'a aucun prix : aucune commande ne peut le citer."
            : `${sansPrix} réseaux n'ont aucun prix : aucune commande ne peut les citer.`}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {entrees.map((entree) => (
          <NetworkCard
            key={entree.network}
            network={entree.network}
            slug={networkSlug(entree.network)}
            price={entree.price ? toEntry(entree.price, rateCdf) : null}
            officialRate={officialRate}
          />
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-sm font-medium">Derniers changements</h2>
          <p className="text-xs text-muted-foreground">
            {filtreActif
              ? `${triees.length} sur ${lignes.length} publications filtrées.`
              : lignes.length === 0
                ? "Aucune publication pour le moment."
                : `${lignes.length} dernières publications, tous réseaux confondus.`}
          </p>
        </div>
        <RecentChangesToolbar exportLignes={triees} />
        <RecentChangesTable
          lignes={visibles}
          messageVide={
            filtreActif
              ? "Aucun changement ne correspond aux filtres."
              : undefined
          }
        />
        <PaginationListe
          page={page}
          totalPages={totalPages}
          hrefBase={hrefBase}
        />
      </section>

      <RateNote rate={officialRate} />
    </div>
  );
}
