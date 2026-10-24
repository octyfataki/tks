"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  ListFilterIcon,
  RotateCcwIcon,
  SearchIcon,
  SearchXIcon,
  XIcon,
} from "lucide-react";
import { AideParcoursBloc } from "@/components/help/help-journey";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  AIDE_THEMES,
  type AideNiveau,
  type AideParcours,
  type AideRepere,
} from "@/lib/help-content";

type Filtre = "tout" | "ouverts" | "bientot" | "reperes";

const SUGGESTIONS: Record<AideNiveau, string[]> = {
  Client: ["tarifs", "compte", "pièce", "commande"],
  Agent: ["validation", "caisse", "transfert", "client"],
  Admin: ["valider", "permission", "trésorerie", "taux"],
};

function normaliser(texte: string) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function compter(nombre: number, singulier: string, pluriel: string) {
  return `${nombre} ${nombre > 1 ? pluriel : singulier}`;
}

function libelleFiltre(filtre: Filtre) {
  switch (filtre) {
    case "tout":
      return "Tout l’aide";
    case "ouverts":
      return "Parcours ouverts";
    case "bientot":
      return "Bientôt";
    case "reperes":
      return "Repères";
  }
}

function contient(parcours: AideParcours, mots: string[]) {
  if (mots.length === 0) return true;
  const corpus = normaliser(
    [
      parcours.titre,
      parcours.resume,
      parcours.theme,
      ...parcours.etapes,
      parcours.garde ?? "",
      ...parcours.motsCles,
    ].join(" "),
  );
  return mots.every((mot) => corpus.includes(mot));
}

function contientRepere(repere: AideRepere, mots: string[]) {
  if (mots.length === 0) return true;
  const corpus = normaliser(
    [repere.titre, repere.texte, repere.exemple ?? ""].join(" "),
  );
  return mots.every((mot) => corpus.includes(mot));
}

export function AideExplorer({
  niveau,
  parcours,
  reperes,
}: {
  niveau: AideNiveau;
  parcours: AideParcours[];
  reperes: AideRepere[];
}) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tout");

  const mots = useMemo(
    () => normaliser(recherche.trim()).split(/\s+/).filter(Boolean),
    [recherche],
  );

  const ouverts = useMemo(
    () => parcours.filter((item) => !item.bientot && contient(item, mots)),
    [parcours, mots],
  );
  const aVenir = useMemo(
    () => parcours.filter((item) => item.bientot && contient(item, mots)),
    [parcours, mots],
  );
  const reperesVisibles = useMemo(
    () => reperes.filter((item) => contientRepere(item, mots)),
    [reperes, mots],
  );

  const themes = useMemo(
    () =>
      AIDE_THEMES[niveau]
        .map((theme) => ({
          theme,
          items: ouverts.filter((item) => item.theme === theme),
        }))
        .filter((groupe) => groupe.items.length > 0),
    [niveau, ouverts],
  );

  const voirOuverts = filtre === "tout" || filtre === "ouverts";
  const voirBientot = filtre === "tout" || filtre === "bientot";
  const voirReperes = filtre === "tout" || filtre === "reperes";

  const totalVisible =
    (voirOuverts ? ouverts.length : 0) +
    (voirBientot ? aVenir.length : 0) +
    (voirReperes ? reperesVisibles.length : 0);

  const rechercheActive = recherche.trim() !== "";
  const filtreActif = rechercheActive || filtre !== "tout";

  const statut = [
    voirOuverts
      ? compter(ouverts.length, "parcours ouvert", "parcours ouverts")
      : null,
    voirBientot
      ? compter(aVenir.length, "parcours à venir", "parcours à venir")
      : null,
    voirReperes ? compter(reperesVisibles.length, "repère", "repères") : null,
  ]
    .filter((element) => element !== null)
    .join(" · ");

  function reinitialiser() {
    setRecherche("");
    setFiltre("tout");
  }

  function chercherPartout(mot: string) {
    setRecherche(mot);
    setFiltre("tout");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                role="searchbox"
                inputMode="search"
                aria-label="Rechercher dans l’aide"
                autoComplete="off"
                placeholder="Rechercher un geste : valider, encaisser, taux…"
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
                className="pr-8 pl-8"
              />
              {rechercheActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRecherche("")}
                  aria-label="Effacer la recherche"
                  className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <XIcon aria-hidden className="size-3.5" />
                </Button>
              ) : null}
            </div>

            <div className="ml-auto flex shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" aria-label="Filtrer l’aide">
                      <ListFilterIcon />
                      {libelleFiltre(filtre)}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-60">
                  {[
                    { valeur: "tout" as const, etiquette: "Tout l’aide" },
                    { valeur: "ouverts" as const, etiquette: "Parcours ouverts" },
                    { valeur: "bientot" as const, etiquette: "Bientôt" },
                    { valeur: "reperes" as const, etiquette: "Repères" },
                  ].map((option) => (
                    <DropdownMenuItem
                      key={option.valeur}
                      onClick={() => setFiltre(option.valeur)}
                    >
                      {filtre === option.valeur ? <CheckIcon /> : null}
                      {option.etiquette}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
      {totalVisible > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <p role="status" aria-live="polite">
            {`${statut}${rechercheActive ? ` pour « ${recherche.trim()} »` : ""}.`}
          </p>
          {filtreActif ? (
            <Button
              type="button"
              variant="link"
              onClick={reinitialiser}
              className="gap-1 font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <RotateCcwIcon aria-hidden className="size-3" />
              Tout réafficher
            </Button>
          ) : null}
        </div>
      ) : null}

      {totalVisible === 0 ? (
        <div className="rounded-xl border bg-card">
          <div className="grid gap-6 p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-8">
            <div className="flex size-14 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-foreground/10">
              <SearchXIcon
                aria-hidden
                className="size-6 text-muted-foreground"
              />
            </div>
            <div>
              <p className="text-[11px] font-medium text-primary">
                Aucun résultat
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                {rechercheActive
                  ? `Rien ici pour « ${recherche.trim()} »`
                  : "Ce filtre ne montre rien"}
              </h2>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
                L’aide ne décrit que ce que l’application fait. Élargissez la
                recherche ou repartez de tous les parcours.
              </p>
              <div className="mt-5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Essayez plutôt
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTIONS[niveau].map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      onClick={() => chercherPartout(suggestion)}
                      className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground outline-none hover:border-primary/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={reinitialiser}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <RotateCcwIcon aria-hidden className="size-3.5" />
                  Tout réafficher
                </Button>
                {filtre !== "tout" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFiltre("tout")}
                    className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    Chercher dans toute l’aide
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {voirOuverts
            ? themes.map((groupe) => (
                <section key={groupe.theme}>
                  <div className="mb-4 flex items-baseline justify-between gap-4 border-b pb-2">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {groupe.theme}
                    </h2>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {groupe.items.length}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {groupe.items.map((item) => (
                      <AideParcoursBloc key={item.id} parcours={item} />
                    ))}
                  </div>
                </section>
              ))
            : null}

          {voirBientot && aVenir.length > 0 ? (
            <section>
              <div className="mb-4 flex items-baseline justify-between gap-4 border-b pb-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  Bientôt dans l’application
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {aVenir.length}
                </span>
              </div>
              <p className="mb-4 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                Décrits par les specs, pas encore livrés. Aucun lien : ces
                écrans ne sont pas ouverts aujourd’hui.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {aVenir.map((item) => (
                  <AideParcoursBloc
                    key={item.id}
                    parcours={item}
                    afficherTheme
                  />
                ))}
              </div>
            </section>
          ) : null}

          {voirReperes && reperesVisibles.length > 0 ? (
            <section>
              <div className="mb-4 flex items-baseline justify-between gap-4 border-b pb-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  Repères
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {reperesVisibles.length}
                </span>
              </div>
              <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                Les règles qui ne changent pas d’un écran à l’autre.
              </p>
              <dl className="mt-2 divide-y">
                {reperesVisibles.map((repere) => (
                  <div
                    key={repere.id}
                    className="grid gap-1.5 py-5 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-6"
                  >
                    <dt className="text-sm font-medium">{repere.titre}</dt>
                    <dd className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                      <p>{repere.texte}</p>
                      {repere.exemple ? (
                        <p className="mt-2 border-l-2 border-primary/60 bg-muted/40 px-3 py-2 text-[13px] leading-relaxed text-foreground tabular-nums">
                          {repere.exemple}
                        </p>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
