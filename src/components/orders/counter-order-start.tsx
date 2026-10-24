import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CounterOrderForm,
  type CounterPrice,
} from "@/components/orders/counter-order-form";
import { CounterOrderSearch } from "@/components/orders/counter-order-search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staffActorWithAny } from "@/lib/authorizations/staff-actor";
import { DEFAULT_PROFILE_CURRENCY } from "@/modules/profiles/profile-record";
import {
  readProfile,
  searchProfiles,
  type ProfileSummary,
} from "@/modules/profiles/find";
import { networkLabel } from "@/modules/pricing/price-record";
import { readGridAt } from "@/modules/pricing/publish";
import { createCounterProfileAction } from "@/modules/orders/actions";

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

function EnTeteCaisse({
  titre,
  description,
}: {
  titre: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        Caisse rapide
      </p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight">{titre}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

function Alerte({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}

export async function CounterOrderStart({
  retour,
  filtres,
}: {
  retour: string;
  filtres: FiltresCaisse;
}) {
  const acteur = await staffActorWithAny(["commande.creer", "dossier.creer"]);
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
            La caisse exige « commande.creer » (placer la commande) et
            « dossier.creer » (créer le profil client).
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
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 p-4 pt-6">
        <EnTeteCaisse
          titre="Commande au comptoir"
          description="Le prix et le plafond sont vérifiés au moment de créer."
        />
        {filtres.erreur ? <Alerte message={filtres.erreur} /> : null}
        <CounterOrderForm
          client={profile.name}
          clientDetail={`${profile.phone} · ${STATUT_LABELS[profile.status] ?? profile.status} · plafond ${profile.limitAmount.toLocaleString("fr-FR")} ${profile.limitCurrency}`}
          changerHref={retour}
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
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-4 pt-10">
      <Card size="sm">
        <CardContent>
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Caisse rapide
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Retrouver le client
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Un numéro ou un nom suffit. Deux clients qui partagent un numéro
            restent deux profils.
          </p>
        </CardContent>
      </Card>

      {filtres.erreur ? <Alerte message={filtres.erreur} /> : null}

      <CounterOrderSearch retour={retour} defaut={q} />

      {q !== "" ? (
        resultats.length === 0 ? (
          <Card size="sm" className="py-0">
            <div className="flex flex-col gap-3 p-4">
              <div>
                <p className="text-sm font-semibold">
                  Aucun profil ne correspond.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Créez le profil du client pour cette commande. Le plafond
                  part à zéro : le crédit reste fermé jusqu&apos;à évaluation.
                </p>
              </div>
              <form
                action={createCounterProfileAction}
                className="flex flex-col gap-3"
              >
                <input type="hidden" name="retour" value={retour} />
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Nom du client</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={nom}
                    required
                  />
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
          </Card>
        ) : (
          <Card size="sm" className="overflow-hidden py-0">
            <ul className="divide-y">
              {resultats.map((resultat) => (
                <li
                  key={resultat.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{resultat.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="tabular-nums">{resultat.phone}</span> ·{" "}
                      {STATUT_LABELS[resultat.status] ?? resultat.status} ·{" "}
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
        <p className="text-center text-sm text-muted-foreground">
          Le résultat s&apos;affiche ici.
        </p>
      )}
    </div>
  );
}
