import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * P0 — Lecture du code source pour les tests structurels d'architecture.
 *
 * Ce fichier ne décide rien, il regarde. Il sert à un seul usage : donner
 * aux garde-fous une image fidèle du code, sans qu'un faux positif ne les
 * rende inutilisables dès la première semaine.
 *
 * Pourquoi une lecture de fichiers plutôt qu'un analyseur d'AST : le
 * vocabulaire du dépôt est lui-même un argument. Un détecteur générique
 * reconnaîtrait `prochains.delete(cle)` — un `Set` d'`URLSearchParams` —
 * comme une écriture en base. Ici, une écriture n'existe que si son argument
 * est une table importée du schéma. C'est plus lent à écrire, et c'est la
 * seule façon d'obtenir un compteur juste.
 */

/** Une écriture réelle : un appel dont l'argument est une table du schéma. */
export type Ecriture = {
  operation: "insert" | "update" | "delete";
  table: string;
  ligne: number;
};

export type Fichier = {
  /** Chemin relatif à `src/`, toujours en `/` pour être stable sur Windows. */
  chemin: string;
  contenu: string;
  /** Cibles d'import brutes : `@/lib/...` ou `./voisin`. */
  imports: string[];
  /** Les tables Drizzle importées par ce fichier. */
  tables: string[];
  /** Les écritures en base, une par occurrence. */
  ecritures: Ecriture[];
};

const EXTENSIONS = [".ts", ".tsx"];
const RACINE = resolve(process.cwd(), "src");

/** Dossiers ignorés : ils ne contiennent aucune règle à faire respecter. */
const IGNORES = new Set(["node_modules", ".next", "coverage"]);

/** Table Drizzle : `export const maTable = mysqlTable(`. */
const TABLE_EXPORT = /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*mysqlTable\b/;

/** Import : on capture la clause et le module, la détection s'appuie sur le nom. */
const IMPORT = /import\s+(?:type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g;

/** Appel d'écriture : seul l'argument compte, il sera confirmé. */
const APPEL_ECRITURE = /\.\s*(insert|update|delete)\s*\(\s*([A-Za-z_$][\w$]*)/g;

function listerFichiers(dossier: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(dossier)) {
    if (IGNORES.has(entree)) continue;
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) {
      trouves.push(...listerFichiers(chemin));
      continue;
    }
    if (EXTENSIONS.some((ext) => entree.endsWith(ext))) trouves.push(chemin);
  }
  return trouves;
}

/** Les noms de tables déclarés dans `lib/db/schema`. */
function tablesDuSchema(): Set<string> {
  const tables = new Set<string>();
  const motif = new RegExp(TABLE_EXPORT, "g");
  for (const chemin of listerFichiers(join(RACINE, "lib", "db", "schema"))) {
    const contenu = readFileSync(chemin, "utf-8");
    for (const trouve of contenu.matchAll(motif)) tables.add(trouve[1]);
  }
  return tables;
}

/** Les tables importées par un fichier, à partir des clauses `{ }`. */
function tablesImportees(contenu: string): string[] {
  const trouvees: string[] = [];
  for (const clause of contenu.matchAll(IMPORT)) {
    const accolades = clause[1].match(/\{([\s\S]*?)\}/);
    if (!accolades) continue;
    for (const morceau of accolades[1].split(",")) {
      const nom = morceau
        .replace(/\btype\b/g, "")
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (nom) trouvees.push(nom);
    }
  }
  return trouvees;
}

function lire(chemin: string, tablesSchema: Set<string>): Fichier {
  const contenu = readFileSync(chemin, "utf-8");
  const contientTable = new RegExp(TABLE_EXPORT, "g").test(contenu);
  const tables = new Set(
    tablesImportees(contenu).filter(
      (nom) => tablesSchema.has(nom) || contientTable,
    ),
  );

  const imports = [...contenu.matchAll(IMPORT)].map((m) => m[2]);

  const ecritures: Ecriture[] = [];
  for (const appel of contenu.matchAll(APPEL_ECRITURE)) {
    const table = appel[2];
    if (!tables.has(table)) continue;
    ecritures.push({
      operation: appel[1] as Ecriture["operation"],
      table,
      ligne: contenu.slice(0, appel.index).split("\n").length,
    });
  }

  return {
    chemin: relative(RACINE, chemin).split(/[\\/]/).join("/"),
    contenu,
    imports,
    tables: [...tables],
    ecritures,
  };
}

let cache: Fichier[] | null = null;

/** Tout le code de `src/`, lu une fois puis réutilisé par les tests. */
export function lireSrc(): Fichier[] {
  if (cache) return cache;
  const tablesSchema = tablesDuSchema();
  cache = listerFichiers(RACINE).sort().map((c) => lire(c, tablesSchema));
  return cache;
}

/** Les fichiers qui écrivent en base, avec le nombre d'écritures de chacun. */
export function fichiersEcrivants(): { chemin: string; nombre: number }[] {
  return lireSrc()
    .filter((f) => f.ecritures.length > 0)
    .map((f) => ({ chemin: f.chemin, nombre: f.ecritures.length }))
    .sort((a, b) => a.chemin.localeCompare(b.chemin));
}

/** Les fichiers dont un import correspond au motif. */
export function fichiersImportant(motif: RegExp): string[] {
  return lireSrc()
    .filter((f) => f.imports.some((cible) => motif.test(cible)))
    .map((f) => f.chemin)
    .sort();
}

/** Les chemins qui portent un numéro de spec (`s1-`, `s2-`…). */
export function cheminsNumerotes(motif: RegExp): string[] {
  return lireSrc()
    .filter((f) => motif.test(f.chemin))
    .map((f) => f.chemin)
    .sort();
}