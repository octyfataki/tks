import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CircleAlertIcon, PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { lireTauxEnVigueur } from "@/lib/currencies/rates";
import {
  UNITS_PER_DOLLAR,
  isBelowOfficialRate,
  networkFromSlug,
  networkLabel,
} from "@/modules/pricing/price-record";
import {
  actorCanManagePriceGrid,
  readHistory,
  readPriceAt,
} from "@/modules/pricing/publish";
import { PricingDenied } from "../denied";
import { NETWORK_LOGOS } from "@/components/network-assets";
import {
  NOMBRE,
  SAMPLE_UNITS,
  officialRateOf,
  toEntry,
} from "../pricing-display";
import { RateNote } from "../rate-note";
import { PriceHistoryTable, type HistoryRow } from "./history-table";

export default async function NetworkPricePage({
  params,
}: {
  params: Promise<{ network: string }>;
}) {
  const { network: slug } = await params;
  const network = networkFromSlug(slug);
  if (!network) notFound();

  const acteur = await actorCanManagePriceGrid();
  if (!acteur) {
    return <PricingDenied />;
  }

  const instant = new Date();
  const [prix, historique, taux] = await Promise.all([
    readPriceAt(network, instant),
    readHistory(network),
    lireTauxEnVigueur(),
  ]);
  const rateCdf = taux?.valeur ?? null;
  const officialRate = officialRateOf(taux);
  const courant = prix ? toEntry(prix, rateCdf) : null;
  const lignes: HistoryRow[] = historique.map((ligne) => ({
    id: ligne.id,
    current: ligne.id === prix?.id,
    ...toEntry(ligne, rateCdf),
  }));
  const sousLeTaux = prix !== null && isBelowOfficialRate(prix, rateCdf);
  const label = networkLabel(network);
  const comptePublications = `${lignes.length} publication${
    lignes.length > 1 ? "s" : ""
  }`;
  let notePublications = "sur cette fiche";
  if (lignes.length === 0) {
    notePublications = "aucune saisie";
  } else if (lignes.length === 1) {
    notePublications = "une seule saisie";
  }

  let faceAuTauxLabel = "—";
  let faceAuTauxNote = "aucun prix en vigueur";
  if (courant && officialRate) {
    faceAuTauxLabel = sousLeTaux ? "Sous le taux" : "Au niveau ou au-dessus";
    faceAuTauxNote = sousLeTaux
      ? `${NOMBRE.format(SAMPLE_UNITS)} unités sous le taux d'un dollar`
      : `${NOMBRE.format(SAMPLE_UNITS)} unités au niveau ou au-dessus du taux`;
  } else if (courant) {
    faceAuTauxNote = "taux en vigueur indisponible";
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <Link
        href="/admin/pricing"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "-ml-2 self-start",
        })}
      >
        <ArrowLeftIcon />
        Retour à la grille
      </Link>

      <header className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Image
            src={NETWORK_LOGOS[network]}
            alt={`Logo ${label}`}
            width={96}
            height={96}
            className="size-16 shrink-0 overflow-hidden rounded-lg object-cover ring-1 ring-foreground/10"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {label}
              </h1>
              {courant ? (
                <Badge variant="secondary">En vigueur</Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                >
                  Sans prix
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {UNITS_PER_DOLLAR} unités d&apos;airtime = 1 USD. Fiche en lecture
              seule.
            </p>
          </div>
          <Link
            href="/admin/pricing"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "w-full justify-center sm:w-auto",
            })}
          >
            <PencilIcon />
            Modifier depuis la grille
          </Link>
        </div>
      </header>

      {courant ? (
        <section
          aria-labelledby="prix-en-vigueur"
          className="overflow-hidden rounded-xl border bg-card"
        >
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="p-4 sm:p-5">
              <h2
                id="prix-en-vigueur"
                className="text-xs font-medium text-muted-foreground"
              >
                Prix en vigueur
              </h2>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
                <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                  {NOMBRE.format(courant.amount)}
                </span>
                <span className="text-base font-medium text-muted-foreground">
                  {courant.currency}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                les {UNITS_PER_DOLLAR} unités d&apos;airtime
              </p>
              {courant.equivalentLabel ? (
                <p className="mt-2 text-sm text-muted-foreground tabular-nums">
                  {courant.equivalentLabel} au taux en vigueur
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Équivalent indisponible : aucun taux aujourd&apos;hui.
                </p>
              )}
            </div>

            <dl className="grid content-start gap-3 border-t p-4 text-xs sm:p-5 lg:border-t-0 lg:border-l">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">
                  {NOMBRE.format(SAMPLE_UNITS)} unités
                </dt>
                <dd className="text-right font-medium tabular-nums">
                  {courant.sampleLabel}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">En vigueur depuis</dt>
                <dd className="text-right tabular-nums">
                  {courant.effectiveAtLabel}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Saisi par</dt>
                <dd className="max-w-[60%] truncate text-right">
                  {courant.authorLabel}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="prix-en-vigueur"
          className="rounded-xl border bg-card p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CircleAlertIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="prix-en-vigueur" className="text-sm font-medium">
                Aucun prix en vigueur
              </h2>
              <p className="mt-1 max-w-prose text-xs text-muted-foreground">
                Aucune commande ne peut citer {label} tant qu&apos;un prix
                n&apos;est publié. La grille permet de saisir un prix pour
                chaque réseau.
              </p>
            </div>
          </div>
        </section>
      )}

      <section
        aria-label="Repères"
        className="grid divide-y rounded-xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <div className="p-4">
          <p className="text-xs text-muted-foreground">Publications affichées</p>
          <p className="mt-1 text-base font-semibold tracking-tight tabular-nums">
            {lignes.length}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {notePublications}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">Taux en vigueur</p>
          <p className="mt-1 text-base font-semibold tracking-tight tabular-nums">
            {officialRate
              ? `${NOMBRE.format(officialRate.value)} CDF`
              : "Non saisi"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {officialRate
              ? `pour 1 USD, le ${officialRate.label}`
              : "les équivalents sont masqués"}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">Face au taux</p>
          <p
            className={
              sousLeTaux
                ? "mt-1 text-base font-semibold tracking-tight text-amber-700 dark:text-amber-400"
                : "mt-1 text-base font-semibold tracking-tight"
            }
          >
            {faceAuTauxLabel}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {faceAuTauxNote}
          </p>
        </div>
      </section>

      <section id="historique" className="flex scroll-mt-24 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-sm font-medium">Historique</h2>
          <p className="text-xs text-muted-foreground">
            {lignes.length === 0
              ? "Aucune publication"
              : `${comptePublications}, de la plus récente à la plus ancienne`}
          </p>
        </div>
        <PriceHistoryTable rows={lignes} />
      </section>

      <RateNote rate={officialRate} />
    </div>
  );
}
