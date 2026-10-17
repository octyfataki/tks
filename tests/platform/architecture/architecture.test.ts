import { describe, expect, it } from "vitest";
import {
  cheminsNumerotes,
  fichiersEcrivants,
  fichiersImportant,
  lireSrc,
} from "@/platform/architecture/inventory";
import { DETTE, DETTE_NUMEROTEE, EXCEPTIONS_TESTS, MECANISMES_A_POSER, plancher } from "@/platform/architecture/constraints";

/**
 * P0 — Les garde-fous de l'architecture.
 *
 * Le plan (`.scratch/rearchitecture/plan.md`) annonce six listes sorties du
 * code. Ce test ne les fait pas sortir : il empêche qu'elles y **restent en
 * grandissant**. C'est le travail de P1 à P5, pas celui de P0.
 *
 * Deux genres de règles, et les confondre est le défaut qu'on répare ici :
 *
 * - une **règle** ne s'excuse pas. Elle s'écrit ici, sans nombre, sans date.
 * - une **mesure** est datée, chiffrée, et porte la phase qui la fait
 *   disparaître. Elle a le droit d'être fausse aujourd'hui, jamais demain.
 *
 * Ce fichier compte aussi les tests eux-mêmes. C'est voulu, et c'est la seule
 * fois où un garde-fou se surveille : il faut que la mesure soit honnête.
 */

/** Les fichiers de test ne comptent pas dans les plafonds de règle. */
function horsTest(chemin: string): boolean {
  return !chemin.endsWith(".test.ts") && !chemin.endsWith(".test.tsx");
}

const fichiers = lireSrc();
const ecrivants = fichiersEcrivants();
const numerotes = cheminsNumerotes(/(^|\/)s\d+-/);

describe("P0 — la dette d'architecture ne remonte pas", () => {
  it("le nombre de fichiers écrivant en base ne dépasse pas le plancher", () => {
    expect(
      ecrivants.length,
      `${ecrivants.length} fichiers écrivent en base, le plancher est ` +
        `${plancher("fichiersEcrivants")} (dette purgée en ${DETTE.fichiersEcrivants.purge}). ` +
        `Un fichier qui écrit sans passer par la porte fait monter la dette.`,
    ).toBeLessThanOrEqual(plancher("fichiersEcrivants"));
  });

  it("le nombre d'appels d'écriture ne dépasse pas le plancher", () => {
    const reels = ecrivants.reduce((total, f) => total + f.nombre, 0);
    expect(
      reels,
      `${reels} écritures directes, le plancher est ${plancher("ecritures")} ` +
        `(dette purgée en ${DETTE.ecritures.purge}).`,
    ).toBeLessThanOrEqual(plancher("ecritures"));
  });

  it("l'interface n'importe pas la base plus qu'avant", () => {
    const reels = fichiersImportant(/^@\/lib\/db/).filter(
      (chemin) => chemin.startsWith("app/") || chemin.startsWith("components/"),
    ).length;
    expect(
      reels,
      `${reels} fichiers de l'interface importent la base, le plancher est ` +
        `${plancher("fuitesInterface")} (dette purgée en ${DETTE.fuitesInterface.purge}). ` +
        `Une page qui lit la base n'a rien à faire dans une page : elle appelle ` +
        `un mécanisme du socle.`,
    ).toBeLessThanOrEqual(plancher("fuitesInterface"));
  });

  it("les rôles ne sont plus comparés à une chaîne qu'autant qu'avant", () => {
    const reels = fichiers.filter(
      (f) => horsTest(f.chemin) && /"ADMIN_PRINCIPAL"|"ADMIN_TECHNIQUE"/.test(f.contenu),
    ).length;
    expect(
      reels,
      `${reels} fichiers comparent un rôle à une chaîne, le plancher est ` +
        `${plancher("rolesEnDur")} (dette purgée en ${DETTE.rolesEnDur.purge}). ` +
        `Un rôle se lit en table.`,
    ).toBeLessThanOrEqual(plancher("rolesEnDur"));
  });

  it("le nombre de chemins numérotés ne dépasse pas le plancher", () => {
    expect(
      numerotes.length,
      `${numerotes.length} chemins portent un numéro de spec, le plancher est ` +
        `${plancher("cheminsNumerotes")} (dette purgée en ${DETTE.cheminsNumerotes.purge}).`,
    ).toBeLessThanOrEqual(plancher("cheminsNumerotes"));
  });

  it("aucun dossier numéroté n'apparaît en dehors de la dette déclarée", () => {
    const apparus = numerotes.filter(
      (chemin) =>
        !DETTE_NUMEROTEE.some((entree) => chemin.startsWith(entree.dossier)),
    );
    expect(
      apparus,
      `Ces chemins sont numérotés par spec et ne sont dans aucune dette déclarée :\n` +
        `${apparus.join("\n")}\nUn numéro de spec est un calendrier de chantier. ` +
        `Un module neuf va dans modules/, sans numéro. Si ce dossier doit exister, ` +
        `il se déclare dans DETTE_NUMEROTEE avec la phase qui l'emportera.`,
    ).toEqual([]);
  });
});

/**
 * ADR-0008 — `src/` ne contient que du produit, les tests vivent dans
 * `tests/`. Ce bloc rend la décision mécanique : un test déposé dans
 * `src/` fait échouer la suite, sans qu'on ait à s en souvenir.
 */
describe("ADR-0008 — aucun test dans src/", () => {
  const intrus = fichiers
    .filter((f) => f.chemin.endsWith(".test.ts") || f.chemin.endsWith(".test.tsx"))
    .map((f) => f.chemin)
    .filter((chemin) => !EXCEPTIONS_TESTS.some((e) => chemin === e.chemin))
    .sort();

  it("ne dépose aucun fichier de test dans src/", () => {
    expect(
      intrus,
      `Ces tests sont dans src/, alors qu'ils appartiennent à tests/ :\n` +
        `${intrus.join("\n")}\n` +
        `Déplace le fichier, puis réécris ses imports en @/.\n` +
        `Si tu crois vraiment que src/ est le bon endroit, c'est que l'ADR-0008\n` +
        `doit être réécrit — pas contourné en silence.`,
    ).toEqual([]);
  });

  it("chaque exception porte une phase qui l'emporte", () => {
    const sansPhase = EXCEPTIONS_TESTS.filter((e) => !e.purge.trim()).map((e) => e.chemin);
    expect(
      sansPhase,
      `Ces tests sont tolérés dans src/ sans raison de partir : ${sansPhase.join(", ")}`,
    ).toEqual([]);
  });

  it("chaque exception existe encore", () => {
    const disparus = EXCEPTIONS_TESTS.filter((e) => !fichiers.some((f) => f.chemin === e.chemin));
    expect(
      disparus,
      `Ces exceptions ne couvrent plus rien — le fichier est parti, efface l'entrée :\n` +
        `${disparus.map((e) => e.chemin).join("\n")}`,
    ).toEqual([]);
  });
});

describe("P0 — la dette déclarée ne peut pas devenir permanente", () => {  it("chaque dette chiffrée porte une phase qui la purge", () => {
    const sansPhase = Object.entries(DETTE)
      .filter(([, entree]) => !entree.purge.trim())
      .map(([cle]) => cle);
    expect(
      sansPhase,
      `Une dette sans date d'expiration est une liste blanche, pas une dette : ${sansPhase.join(", ")}`,
    ).toEqual([]);
  });

  it("chaque dossier numéroté porte une phase qui l'emporte", () => {
    const sansPhase = DETTE_NUMEROTEE.filter((e) => !e.purge.trim()).map((e) => e.dossier);
    expect(
      sansPhase,
      `Ces dossiers sont numérotés et personne n'a dit quand ils partent : ${sansPhase.join(", ")}`,
    ).toEqual([]);
  });

  it("la dette numérotée ne couvre que des dossiers réellement présents", () => {
    const disparus = DETTE_NUMEROTEE.filter((e) => !numerotes.some((c) => c.startsWith(e.dossier)));
    expect(
      disparus,
      `Ces dossiers sont déclarés en dette mais n'existent plus. C'est bon signe — ` +
        `effacez-les de DETTE_NUMEROTEE :\n${disparus.map((e) => e.dossier).join("\n")}`,
    ).toEqual([]);
  });

  it("chaque mécanisme vise bien une couche du socle ou de l'infrastructure", () => {
    const horsCible = MECANISMES_A_POSER.filter(
      (m) => !/^(platform|infrastructure)\//.test(m.cible),
    ).map((m) => `${m.nom} → ${m.cible}`);
    expect(
      horsCible,
      `Un mécanisme qui ne vit pas dans le socle ne sera pas réutilisable :\n${horsCible.join("\n")}`,
    ).toEqual([]);
  });
});

describe("P0 — la dépendance descend, jamais ne remonte", () => {
  /** Les couches qu'un socle ne doit pas connaître. */
  const INTERDIT_AU_SOCLE = /^@\/(app|components|modules|hooks)\b/;

  const coupables = (prefixe: string) =>
    fichiers
      .filter((f) => f.chemin.startsWith(prefixe))
      .filter((f) => f.imports.some((cible) => INTERDIT_AU_SOCLE.test(cible)))
      .map((f) => f.chemin);

  it("le socle n'importe jamais l'interface ni les modules", () => {
    const trouvees = coupables("platform/");
    expect(
      trouvees,
      `Le socle est le mécanisme. Il ne connaît ni l'interface ni les modules, ` +
        `sinon il n'est plus réutilisable.\n${trouvees.join("\n")}`,
    ).toEqual([]);
  });

  it("l'infrastructure n'importe jamais l'interface ni les modules", () => {
    const trouvees = coupables("infrastructure/");
    expect(trouvees, trouvees.join("\n")).toEqual([]);
  });
});