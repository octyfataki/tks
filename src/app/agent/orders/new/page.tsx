import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon, UserPlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staffActorWith } from "@/lib/authorizations/staff-actor";
import { DEFAULT_PROFILE_CURRENCY } from "@/modules/profiles/profile-record";
import { readProfile, searchProfiles } from "@/modules/profiles/find";
import { networkLabel } from "@/modules/pricing/price-record";
import { readGridAt } from "@/modules/pricing/publish";
import { createCounterProfileAction } from "../actions";
import { CounterOrderForm, type CounterPrice } from "./counter-order-form";

export const metadata: Metadata = {
  title: "Nouvelle commande — Agent — TKS",
  description: "Caisse rapide : retrouver un client, chiffrer, créer la commande.",
};

type Filtres = {
  q?: string;
  contact?: string;
  nom?: string;
  profileId?: string;
  erreur?: string;
};

const STATUT_LABELS: Record<string, string> = {
  EN_EVALUATION: "En évaluation",
  PRIVILEGIE: "Privilégié",
};

export default async function NewCounterOrderPage({
  searchParams,
}: {
  searchParams: Promise<Filtres>;
}) {
  const acteur = await staffActorWith("commande.creer");
  if (!acteur) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <UserPlusIcon
            aria-hidden
            className="mx-auto size-8 text-muted-foreground"
          />
          <h1 className="mt-3 text-lg font-semibold">Caisse rapide</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créer une commande exige la permission « commande.creer ».
          </p>
        </div>
      </div>
    );
  }

  const filtres = await searchParams;
  const profile = filtres.profileId
    ? await readProfile(filtres.profileId)
    : null;
  const q = filtres.q?.trim() ?? "";
  const resultats = profile === null && q !== "" ? await searchProfiles(q) : [];

  if (profile !== null) {
    const entrees = await readGridAt(new Date());
    const prices: CounterPrice[] = entrees.map((entree) => ({
      network: entree.network,
      label: networkLabel(entree.network),
      amount: entree.price?.amount ?? 0,
      currency: entree.price?.currency ?? DEFAULT_PROFILE_CURRENCY,
    }));
    return (
      <div className="flex flex-1 flex-col gap-5 p-4 pt-4">
        <header>
          <Badge variant="outline">Caisse rapide</Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Commande au comptoir
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Le prix et le plafond sont vérifiés au moment de créer.
          </p>
        </header>

        {filtres.erreur ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {filtres.erreur}
          </p>
        ) : null}

        <section className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">{profile.name}</p>
            <p className="text-sm text-muted-foreground">
              {profile.phone} ·{" "}
              {STATUT_LABELS[profile.status] ?? profile.status} · plafond{" "}
              <span className="tabular-nums">
                {profile.limitAmount.toLocaleString("fr-FR")}{" "}
                {profile.limitCurrency}
              </span>
            </p>
          </div>
          <Link
            href="/agent/orders/new"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Changer de client
          </Link>
        </section>

        <CounterOrderForm profileId={profile.id} prices={prices} />
      </div>
    );
  }

  const telephone = filtres.contact?.trim() ?? "";
  const nom = filtres.nom?.trim() ?? "";

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 pt-4">
      <header>
        <Badge variant="outline">Caisse rapide</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Retrouver le client
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Un numéro suffit. Deux clients qui partagent un numéro restent deux
          profils : vérifiez le nom avant de choisir.
        </p>
      </header>

      {filtres.erreur ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {filtres.erreur}
        </p>
      ) : null}

      <form method="get" className="flex max-w-xl flex-wrap items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="q">Téléphone ou nom</Label>
          <Input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="0812 345 678"
            autoComplete="off"
          />
        </div>
        <Button type="submit" variant="outline">
          <SearchIcon aria-hidden />
          Chercher
        </Button>
      </form>

      {q !== "" ? (
        resultats.length === 0 ? (
          <div className="max-w-xl rounded-lg border border-dashed px-4 py-5">
            <p className="text-sm font-medium">Aucun profil ne correspond.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez le profil du client pour cette commande. Le plafond part à
              zéro : le crédit reste fermé jusqu&apos;à évaluation.
            </p>
            <form
              action={createCounterProfileAction}
              className="mt-4 flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nom du client</Label>
                <Input id="name" name="name" defaultValue={nom} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={telephone || q}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Adresse (facultatif)</Label>
                <Input id="address" name="address" />
              </div>
              <Button type="submit" className="self-start">
                <UserPlusIcon aria-hidden />
                Créer le profil et continuer
              </Button>
            </form>
          </div>
        ) : (
          <ul className="max-w-xl divide-y border-y">
            {resultats.map((resultat) => (
              <li
                key={resultat.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{resultat.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {resultat.phone} ·{" "}
                    {STATUT_LABELS[resultat.status] ?? resultat.status} ·
                    plafond{" "}
                    <span className="tabular-nums">
                      {resultat.limitAmount.toLocaleString("fr-FR")}{" "}
                      {resultat.limitCurrency}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/agent/orders/new?profileId=${encodeURIComponent(resultat.id)}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Choisir
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          Saisissez un numéro ou un nom pour commencer.
        </p>
      )}
    </div>
  );
}
