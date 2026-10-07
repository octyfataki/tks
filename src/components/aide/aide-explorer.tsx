/**
 * Îlot client de la page d'aide : recherche + filtre par niveau
 * (Aide Client, Aide Agent, Aide Admin). Seul composant "use client" du
 * parcours : les sections et le rappel « Bientôt » restent des données
 * statiques sérialisables.
 */
"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Briefcase,
  Hourglass,
  LayoutDashboard,
  Search,
  User,
  RotateCcw,
} from "lucide-react";
import { AideRaccourciCard } from "@/components/aide/aide-card";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
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

/** Une rubrique = un niveau : titre, phrase, grille de cartes cliquables. */
function AideRubrique({
  section,
  mots,
}: {
  section: AideSectionNiveau;
  mots: string[];
}) {
  const Icone = ICONES[section.niveau];
  const cartes = section.raccourcis.filter((r) => raccourciVisible(r, mots));
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
  const [, startTransition] = useTransition();

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

  const bientotEntrees = useMemo(() => {
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

  const bientotVisible = bientotEntrees.length > 0;

  const nbCartes =
    rubriques.reduce(
      (total, s) =>
        total + s.raccourcis.filter((r) => raccourciVisible(r, mots)).length,
      0,
    ) + bientotEntrees.length;
  const filtreActif = recherche.trim() !== "" || niveauEffectif !== "Tous";
  const rien = nbCartes === 0 && !bientotVisible;

  return (
    <div className="flex flex-col gap-6">
      <form
        role="search"
        aria-label="Rechercher un raccourci"
        className="flex flex-col gap-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <Field>
          <FieldLabel htmlFor="aide-recherche">
            Que cherchez-vous ? (page, fonctionnalité…)
          </FieldLabel>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="aide-recherche"
              type="search"
              autoComplete="off"
              placeholder="Ex. valider un compte, inviter, mot de passe…"
              value={recherche}
              onChange={(e) => startTransition(() => setRecherche(e.target.value))}
              className="pl-7"
            />
          </div>
        </Field>
        {niveauFixe ? null : (
          <div
            role="group"
            aria-label="Filtrer par niveau"
            className="flex flex-wrap gap-1.5"
          >
            {AIDE_NIVEAUX.map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant={niveau === n ? "default" : "outline"}
                aria-pressed={niveau === n}
                onClick={() => startTransition(() => setNiveau(n))}
              >
                {n === "Tous" ? "Tous" : `Aide ${n}`}
              </Button>
            ))}
          </div>
        )}
      </form>

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
            ou choisissez votre niveau ci-dessus.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              startTransition(() => {
                setRecherche("");
                setNiveau(niveauFixe ?? "Tous");
              })
            }
            className="mt-1"
          >
            <RotateCcw aria-hidden data-icon="inline-start" />
            Tout réafficher
          </Button>
        </div>
      ) : (
        <>
          {rubriques.map((section) => (
            <AideRubrique key={section.niveau} section={section} mots={mots} />
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
