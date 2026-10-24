import { SearchIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staffActorWith } from "@/lib/authorizations/staff-actor";
import { DEFAULT_PROFILE_CURRENCY } from "@/modules/profiles/profile-record";
import {
  readProfile,
  searchProfiles,
  type ProfileSummary,
} from "@/modules/profiles/find";
import { networkLabel } from "@/modules/pricing/price-record";
import { readGridAt } from "@/modules/pricing/publish";
import { createCounterProfileAction } from "@/modules/orders/actions";
import { CounterOrderForm, type CounterPrice } from "@/components/orders/counter-order-form";

export type FiltresCaisse = {
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

function ChampComptoir({
  id,
  libelle,
  nom,
  defaut,
  requis,
}: {
  id: string;
  libelle: string;
  nom: string;
  defaut?: string;
  requis?: boolean;
}): ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{libelle}</Label>
      <Input id={id} name={nom} defaultValue={defaut} required={requis} />
    </div>
  );
}

export async function CounterOrderStart({
  retour,
  filtres,
}: {
  retour: string;
  filtres: FiltresCaisse;
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

  const profile = filtres.profileId ? await readProfile(filtres.profileId) : null;
  const q = filtres.q?.trim() ?? "";
  const resultats: ProfileSummary[] =
    profile === null && q !== "" ? await searchProfiles(q) : [];

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
        <header className="max-w-2xl">
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
            className="max-w-2xl rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {filtres.erreur}
          </p>
        ) : null}

        <Card size="sm" className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              {profile.name}
            </CardTitle>
            <CardAction>
              <Link
                href={retour}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Changer de client
              </Link>
            </CardAction>
            <CardDescription>
              {profile.phone} ·{" "}
              {STATUT_LABELS[profile.status] ?? profile.status} · plafond{" "}
              <span className="tabular-nums">
                {profile.limitAmount.toLocaleString("fr-FR")}{" "}
                {profile.limitCurrency}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>

        <CounterOrderForm
          profileId={profile.id}
          prices={prices}
          retour={retour}
        />
      </div>
    );
  }

  const telephone = filtres.contact?.trim() ?? "";
  const nom = filtres.nom?.trim() ?? "";

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 pt-4">
      <header className="max-w-2xl">
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
          className="max-w-2xl rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {filtres.erreur}
        </p>
      ) : null}

      <Card size="sm" className="max-w-2xl">
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 basis-52">
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
        </CardContent>
      </Card>

      {q !== "" ? (
        resultats.length === 0 ? (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Aucun profil ne correspond</CardTitle>
              <CardDescription>
                Créez le profil du client pour cette commande. Le plafond part à
                zéro : le crédit reste fermé jusqu&apos;à évaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createCounterProfileAction} className="flex flex-col gap-3">
                <input type="hidden" name="retour" value={retour} />
                <ChampComptoir
                  id="name"
                  libelle="Nom du client"
                  nom="name"
                  defaut={nom}
                  requis
                />
                <ChampComptoir
                  id="phone"
                  libelle="Téléphone"
                  nom="phone"
                  defaut={telephone || q}
                  requis
                />
                <ChampComptoir
                  id="address"
                  libelle="Adresse (facultatif)"
                  nom="address"
                />
                <Button type="submit" className="self-start">
                  <UserPlusIcon aria-hidden />
                  Créer le profil et continuer
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl overflow-hidden py-0">
            <ul className="divide-y">
              {resultats.map((resultat) => (
                <li
                  key={resultat.id}
                  className="group flex flex-wrap items-center justify-between gap-2 px-4 py-3"
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
                    href={`${retour}?profileId=${encodeURIComponent(resultat.id)}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Choisir
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          Saisissez un numéro ou un nom pour commencer.
        </p>
      )}
    </div>
  );
}
