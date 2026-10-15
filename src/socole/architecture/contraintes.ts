/**
 * P0 — Trois choses que ce fichier ne doit jamais confondre.
 *
 * 1. **Les règles** : ce qui doit être vrai, sans exception admise. Elles sont
 *    écrites dans le test, pas ici. Aucune ligne de ce fichier n'en est une.
 * 2. **La dette** : ce qui est mesuré un jour donné, et qui doit **baisser**.
 *    Elle est datée, chiffrée, et chaque ligne dit dans quelle phase elle
 *    disparaît. Une dette sans date d'expiration n'est pas une dette, c'est
 *    une liste blanche déguisée.
 * 3. **La carte** : où chaque mécanisme doit atterrir.
 *
 * Pourquoi des chiffres écrits en dur alors que le plan reproche justement les
 * listes en dur : parce qu'une mesure figée n'est pas une règle. Un plancher
 * calculé à chaque exécution — « tout ce qui existe aujourd'hui est accepté »
 * — donnerait un test vert par construction, donc inutile. Ici, le nombre est
 * une **mesure datée** : le faire descendre est un travail, et le test oblige
 * à le voir.
 *
 * La seule chose qui ne doit pas arriver : une entrée de dette qui perd sa
 * date d'expiration. C'est vérifié par un test, dans `tests/socole/`.
 */

/** Une dette mesurée. `purge` dit la phase qui la fait disparaître. */
export type EntreeDette = {
  /** La mesure, en clair — le test l'affiche en cas d'échec. */
  mesure: string;
  /** La valeur relevée, jamais un calcul. */
  valeur: number;
  /** La phase qui ramène cette dette à sa cible. Jamais vide. */
  purge: string;
};

export const DETTE: Record<string, EntreeDette> = {
  fichiersEcrivants: {
    mesure: "fichiers écrivant directement en base",
    valeur: 16,
    purge: "P1",
  },
  ecritures: {
    mesure: "appels d'écriture directe en base",
    valeur: 66,
    purge: "P1",
  },
  fuitesInterface: {
    mesure: "fichiers de app/ ou components/ qui importent la base",
    valeur: 40,
    purge: "P1",
  },
  rolesEnDur: {
    mesure: "fichiers comparant un rôle à une chaîne",
    valeur: 22,
    purge: "P2",
  },
  cheminsNumerotes: {
    mesure: "chemins portant un numéro de spec",
    valeur: 0,
    purge: "P5 — purgée le 2026-10-15 : s1-comptes→comptes, s2-autorisations→autorisations, s3-devises→devises, s4-annotations→annotations",
  },
};

/** Le nombre mesuré, ou une erreur franche si la clé a disparu. */
export function plancher(cle: keyof typeof DETTE): number {
  return DETTE[cle].valeur;
}

/**
 * Les dossiers numérotés par spec — purgés le 2026-10-15.
 *
 * `s1-comptes→comptes`, `s2-autorisations→autorisations`,
 * `s3-devises→devises`, `s4-annotations→annotations` (+ jumeaux
 * `lib/db/schema/` et miroirs `tests/`). Le test
 * « la dette numérotée ne couvre que des dossiers réellement présents »
 * impose de vider cette liste quand les dossiers partent : la garder
 * avec d'anciens noms ferait échouer la suite.
 */
export const DETTE_NUMEROTEE: { dossier: string; purge: string }[] = [];

/**
 * Les seuls tests tolérés dans `src/`.
 *
 * ADR-0008 : `src/` ne contient que du produit. Cette liste existe parce
 * qu'un chantier parallèle a déposé deux tests avant la décision — elle
 * n'est pas une autorisation, c'est une dette, et elle est appelée vide.
 *
 * Chaque entrée porte sa phase de sortie, pour la même raison que la dette
 * numérotée : une exception sans échéance est une permission permanente.
 */
export const EXCEPTIONS_TESTS: { chemin: string; purge: string }[] = [
  { chemin: "modules/clients/dossier.test.ts", purge: "démarche en cours" },
  {
    chemin: "modules/clients/table-structure.test.ts",
    purge: "démarche en cours",
  },
];

/**
 * Les sept mécanismes à poser, et où ils vont. P1 à P5 consomment cette
 * carte : elle évite de décider deux fois.
 */
export const MECANISMES_A_POSER: {
  nom: string;
  aujourdhui: string;
  cible: string;
  phase: string;
}[] = [
  {
    nom: "Porte d'écriture",
    aujourdhui: "aucune — 15 fichiers écrivent en base",
    cible: "socole/ecriture",
    phase: "P1",
  },
  {
    nom: "Fichiers déposés",
    aujourdhui: "quatre voies, aucune abstraction",
    cible: "socole/fichiers",
    phase: "P0b",
  },
  {
    nom: "Contrôle d'accès",
    aujourdhui: "lib/autorisations + PERMISSIONS_FERMEES",
    cible: "socole/autorisation",
    phase: "P2",
  },
  {
    nom: "Moteur de transitions",
    aujourdhui: "une fonction par entité, dispersée",
    cible: "socole/transition",
    phase: "P3",
  },
  {
    nom: "Journal d'audit",
    aujourdhui: "lib/autorisations/audit-log",
    cible: "socole/audit-log",
    phase: "P3",
  },
  {
    nom: "Modèle monétaire",
    aujourdhui: "lib/devises + validation.ts",
    cible: "socole/argent",
    phase: "P3",
  },
  {
    nom: "Base et authentification",
    aujourdhui: "lib/db, lib/auth.ts",
    cible: "infrastructure/",
    phase: "P5",
  },
];
