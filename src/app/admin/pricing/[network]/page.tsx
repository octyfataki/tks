import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { lireTauxDuJour } from "@/lib/currencies/rates";
import {
  UNITS_PER_DOLLAR,
  networkFromSlug,
  networkLabel,
} from "@/modules/pricing/price-record";
import {
  actorCanManagePriceGrid,
  readHistory,
  readPriceAt,
} from "@/modules/pricing/publish";
import { PricingDenied } from "../denied";
import { NETWORK_LOGOS } from "../network-logo";
import {
  NOMBRE,
  SAMPLE_UNITS,
  officialRateOf,
  toEntry,
} from "../pricing-display";
import { RateNote } from "../rate-note";

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
    lireTauxDuJour(),
  ]);
  const rateCdf = taux?.valeur ?? null;
  const officialRate = officialRateOf(taux);
  const courant = prix ? toEntry(prix, rateCdf) : null;
  const lignes = historique.map((ligne) => toEntry(ligne, rateCdf));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <Link
        href="/admin/pricing"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        <ArrowLeftIcon />
        Retour à la grille
      </Link>

      <header className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center gap-4 border-b p-4 sm:p-5">
          <Image
            src={NETWORK_LOGOS[network]}
            alt={`Logo ${networkLabel(network)}`}
            width={96}
            height={96}
            className="size-14 shrink-0 rounded-md bg-white object-contain p-1.5 ring-1 ring-foreground/10"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              {networkLabel(network)}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Prix de {UNITS_PER_DOLLAR} unités — un dollar d&apos;airtime
            </p>
          </div>
          <div className="ml-auto">
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
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 p-4 sm:p-5">
          <div className="min-w-0">
            {courant ? (
              <>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    {courant.amountLabel}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    les {UNITS_PER_DOLLAR} unités
                  </span>
                </p>
                {courant.equivalentLabel ? (
                  <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                    {courant.equivalentLabel}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {NOMBRE.format(SAMPLE_UNITS)} unités coûtent{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {courant.sampleLabel}
                  </span>
                  .
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  En vigueur depuis le {courant.effectiveAtLabel} · posé par{" "}
                  {courant.authorLabel}.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun prix pour ce réseau. Tant qu&apos;il n&apos;en a pas,
                aucune commande ne peut le citer.
              </p>
            )}
          </div>
          <Link
            href="/admin/pricing"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Modifier depuis la grille
          </Link>
        </div>
      </header>

      <section id="historique" className="flex flex-col gap-2 scroll-mt-24">
        <h2 className="text-sm font-medium">Historique ({lignes.length})</h2>
        {lignes.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
            Aucun prix publié pour ce réseau.
          </p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {lignes.map((ligne, index) => (
              <li
                key={`${ligne.effectiveAtLabel}-${index}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border bg-card px-3 py-2 text-xs"
              >
                <span className="text-sm font-medium tabular-nums">
                  {ligne.amountLabel}
                </span>
                {ligne.equivalentLabel ? (
                  <span className="tabular-nums text-muted-foreground">
                    {ligne.equivalentLabel}
                  </span>
                ) : null}
                {index === 0 ? <Badge variant="secondary">En vigueur</Badge> : null}
                <span className="ml-auto text-muted-foreground">
                  {ligne.effectiveAtLabel} · {ligne.authorLabel}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <RateNote rate={officialRate} />
    </div>
  );
}
