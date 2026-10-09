/**
 * Îlot client de la page d'aide : recherche + filtre par niveau
 * (Aide Client, Aide Agent, Aide Admin). Seul composant "use client" du
 * parcours : les sections et le rappel « Bientôt » restent des données
 * statiques sérialisables.
 *
 * Barre d'outils alignée sur /admin/invitations (registre-invitations) :
 * même Card, même recherche, mêmes menus Filtrer / Trier — sans les
 * boutons Exporter ni Inviter, inutiles ici.
 */
"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDownUpIcon,
  Briefcase,
  CheckIcon,
  Hourglass,
  LayoutDashboard,
  ListFilterIcon,
  SearchIcon,
  User,
  RotateCcw,
} from "lucide-react";
import { AideRaccourciCard } from "@/components/aide/aide-card";
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
  AIDE_BIENTOT,
  AIDE_NIVEAUX,
  type AideNiveau,
  type AideRaccourci,
  type AideSectionNiveau,
} from "@/lib/aide-content";

const ICONES: Record<AideNiveau, typeof User> = {
  Client: User,
  Agent: Briefcase,
  Admin: LayoutDashboard,
};

function normaliser(texte: string) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function raccourciVisible(raccourci: AideRaccourci, mots: string[]) {
  if (mots.length === 0) return true;
  const corpus = normaliser(
    [raccourci.label, raccourci.description, ...(raccourci.motsCles ?? [])].join(
      " ",
    ),
  );
  return mots.every((mot) => corpus.includes(mot));
}

const FILTRES = [
  { valeur: "Tous", etiquette: "Tous" },
  { valeur: "Client", etiquette: "Aide Client" },
  { valeur: "Agent", etiquette: "Aide Agent" },
  { valeur: "Admin", etiquette: "Aide Admin" },
] as const;

const TRIS = [
  { valeur: "", etiquette: "Ordre conseillé" },
  { valeur: "az", etiquette: "A → Z" },
  { valeur: "za", etiquette: "Z → A" },
] as const;

function etiquette(
  valeurs: readonly { valeur: string; etiquette: string }[],
  actif: string,
) {
  return valeurs.find((v) => v.valeur === actif)?.etiquette ?? valeurs[0].etiquette;
}

function trierLabels<T extends { label?: string; entree?: string }>(
  entrees: T[],
  tri: string,
  texte: (e: T) => string,
): T[] {
  if (tri === "az")
    return [...entrees].sort((a, b) =>
      texte(a).localeCompare(texte(b), "fr", { sensitivity: "base" }),
    );
  if (tri === "za")
    return [...entrees].sort((a, b) =>
      texte(b).localeCompare(texte(a), "fr", { sensitivity: "base" }),
    );
  return entrees;
}

/** Une rubrique = un niveau : titre, phrase, grille de cartes cliquables. */
function AideRubrique({
  section,
  mots,
  tri,
}: {
  section: AideSectionNiveau;
  mots: string[];
  tri: string;
}) {
  const Icone = ICONES[section.niveau];
  const visibles = section.raccourcis.filter((r) => raccourciVisible(r, mots));
  const cartes = trierLabels(visibles, tri, (r) => r.label);
  const astuceVisible =
    mots.length === 0 ||
    cartes.length > 0 ||
    mots.every((mot) =>
      normaliser(
        `Aide ${section.niveau} ${section.phrase} ${section.astuce ?? ""}`,
      ).includes(mot),
    );
  if (cartes.length === 0 && !astuceVisible) return null;

  const ancre = `aide-${section.niveau.toLowerCase()}`;

  return (
    <section aria-labelledby={ancre} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icone aria-hidden />
        </span>
        <div>
          <h2 id={ancre} className="text-base font-semibold">
            Aide {section.niveau}
          </h2>
          <p className="text-xs text-muted-foreground">{section.phrase}</p>
        </div>
      </div>
      {cartes.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cartes.map((raccourci) => (
            <AideRaccourciCard key={raccourci.label} raccourci={raccourci} />
          ))}
        </div>
      ) : null}
      {section.astuce && astuceVisible ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <strong className="font-semibold text-foreground">Bon réflexe : </strong>
          {section.astuce}
        </p>
      ) : null}
    </section>
  );
}

export function AideExplorer({
  sections,
  niveauFixe,
}: {
  sections: AideSectionNiveau[];
  /** Verrouille l'annuaire sur un niveau : filtre et rappel cachés. */
  niveauFixe?: AideNiveau;
}) {
  const [recherche, setRecherche] = useState("");
  const [niveau, setNiveau] = useState<(typeof AIDE_NIVEAUX)[number]>(
    niveauFixe ?? "Tous",
  );
  const [tri, setTri] = useState("");
  const [, startTransition] = useTransition();

  function choisirNiveau(valeur: (typeof AIDE_NIVEAUX)[number]) {
    startTransition(() => setNiveau(valeur));
  }

  function choisirTri(valeur: string) {
    startTransition(() => setTri(valeur));
  }

  function toutReafficher() {
    startTransition(() => {
      setRecherche("");
      setNiveau(niveauFixe ?? "Tous");
      setTri("");
    });
  }

  const mots = useMemo(
    () =>
      normaliser(recherche.trim())
        .split(/\s+/)
        .filter(Boolean),
    [recherche],
  );

  const niveauEffectif = niveauFixe ?? niveau;

  const rubriques = useMemo(
    () =>
      sections.filter((s) => niveauEffectif === "Tous" || s.niveau === niveauEffectif),
    [sections, niveauEffectif],
  );

  const bientotBrutes = useMemo(() => {
    if (niveauEffectif !== "Tous") return [];
    return AIDE_BIENTOT.flatMap((groupe) =>
      groupe.entrees
        .filter(
          (entree) =>
            mots.length === 0 ||
            mots.every((mot) =>
              normaliser(`Bientôt ${groupe.theme} ${entree}`).includes(mot),
            ),
        )
        .map((entree) => ({ theme: groupe.theme, entree })),
    );
  }, [niveauEffectif, mots]);
  const bientotEntrees = useMemo(
    () => trierLabels(bientotBrutes, tri, (e) => e.entree),
    [bientotBrutes, tri],
  );

  const bientotVisible = bientotEntrees.length > 0;

  const nbCartes =
    rubriques.reduce(
      (total, s) =>
        total + s.raccourcis.filter((r) => raccourciVisible(r, mots)).length,
      0,
    ) + bientotEntrees.length;
  const filtreActif =
    recherche.trim() !== "" ||
    (!niveauFixe && niveau !== "Tous") ||
    tri !== "";
  const rien = nbCartes === 0 && !bientotVisible;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 basis-52 sm:max-w-xs">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="aide-recherche"
                type="search"
                role="searchbox"
                aria-label="Rechercher un raccourci"
                autoComplete="off"
                placeholder="Ex. valider un compte, inviter, mot de passe…"
                value={recherche}
                onChange={(e) => {
                  const valeur = e.target.value;
                  startTransition(() => setRecherche(valeur));
                }}
                className="pl-8"
              />
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {niveauFixe ? null : (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" aria-label="Filtrer par niveau">
                        <ListFilterIcon />
                        {niveau === "Tous"
                          ? "Filtrer"
                          : etiquette(FILTRES, niveau)}
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-56">
                    {FILTRES.map((option) => (
                      <DropdownMenuItem
                        key={option.valeur}
                        onClick={() =>
                          choisirNiveau(
                            option.valeur as (typeof AIDE_NIVEAUX)[number],
                          )
                        }
                      >
                        {niveau === option.valeur ? <CheckIcon /> : null}
                        {option.etiquette}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" aria-label="Trier les cartes">
                      <ArrowDownUpIcon />
                      {tri ? etiquette(TRIS, tri) : "Trier"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  {TRIS.map((option) => (
                    <DropdownMenuItem
                      key={option.valeur || "conseille"}
                      onClick={() => choisirTri(option.valeur)}
                    >
                      {tri === option.valeur ? <CheckIcon /> : null}
                      {option.etiquette}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
        {rien
          ? "Aucune carte ne correspond. Essayez un autre mot ou réinitialisez."
          : `${nbCartes} carte${nbCartes > 1 ? "s" : ""} affichée${nbCartes > 1 ? "s" : ""}${filtreActif ? " pour ce filtre" : " au total"}.`}
      </p>

      {rien ? (
        <div
          role="status"
          className="flex flex-col items-center gap-2 rounded-lg border bg-card px-4 py-10 text-center"
        >
          <p className="text-sm font-medium">Rien ici pour « {recherche} »</p>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            Essayez « valider », « inviter », « mot de passe », « taux » —
            {niveauFixe ? " ou réinitialisez la recherche." : " ou choisissez votre niveau ci-dessus."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toutReafficher}
            className="mt-1"
          >
            <RotateCcw aria-hidden data-icon="inline-start" />
            Tout réafficher
          </Button>
        </div>
      ) : (
        <>
          {rubriques.map((section) => (
            <AideRubrique
              key={section.niveau}
              section={section}
              mots={mots}
              tri={tri}
            />
          ))}
          {bientotVisible ? (
            <section aria-labelledby="aide-bientot" className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Hourglass aria-hidden />
                </span>
                <div>
                  <h2 id="aide-bientot" className="text-base font-semibold">
                    Bientôt dans l’app
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Annoncés par les specs, pas encore construits : ils
                    s’allumeront ici et dans la palette (Ctrl+K) à leur
                    livraison.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bientotEntrees.map(({ theme, entree }) => (
                  <AideRaccourciCard
                    key={`${theme}:${entree}`}
                    raccourci={{
                      label: entree,
                      description: theme,
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
