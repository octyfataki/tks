import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import mysql from "mysql2/promise";

const MARQUEUR = "--> statement-breakpoint";
const DOSSIER = resolve(process.cwd(), "drizzle");

type Bloc = { nom: string; sql: string };

function chargerEnvironnement(): void {
  const fichier = join(process.cwd(), ".env.local");
  if (!existsSync(fichier)) return;
  for (const ligne of readFileSync(fichier, "utf8").split("\n")) {
    const trouve = ligne.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (trouve && process.env[trouve[1]] === undefined) {
      process.env[trouve[1]] = trouve[2];
    }
  }
}

function tags(): string[] {
  const brut = readFileSync(join(DOSSIER, "meta", "_journal.json"), "utf8");
  const journal = JSON.parse(brut) as { entries: { tag: string }[] };
  return journal.entries.map((entree) => entree.tag);
}

function blocsDeclencheurs(): Bloc[] {
  const blocs: Bloc[] = [];
  for (const tag of tags()) {
    const contenu = readFileSync(join(DOSSIER, `${tag}.sql`), "utf8");
    for (const morceau of contenu.split(MARQUEUR)) {
      if (!morceau.includes("CREATE TRIGGER")) continue;
      const nom = /CREATE TRIGGER\s+`([^`]+)`/.exec(morceau);
      if (!nom) {
        throw new Error(`Déclencheur sans nom dans ${tag}.sql`);
      }
      blocs.push({ nom: nom[1], sql: morceau.trim() });
    }
  }
  return blocs;
}

async function main(): Promise<void> {
  chargerEnvironnement();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL absente : renseigne .env.local.");
  }
  const attendus = blocsDeclencheurs();
  if (attendus.length === 0) {
    throw new Error("Aucun déclencheur déclaré dans les migrations.");
  }
  const pool = mysql.createPool(url);
  try {
    for (const bloc of attendus) {
      await pool.query(`DROP TRIGGER IF EXISTS \`${bloc.nom}\``);
      await pool.query(bloc.sql);
      console.log(`Déclencheur installé : ${bloc.nom}`);
    }
    const [poses] = await pool.query("SHOW TRIGGERS");
    const presents = new Set(
      (poses as { Trigger: string }[]).map((t) => t.Trigger),
    );
    const manquants = attendus
      .filter((bloc) => !presents.has(bloc.nom))
      .map((bloc) => bloc.nom);
    if (manquants.length > 0) {
      throw new Error(
        `Déclencheurs absents après installation : ${manquants.join(", ")}`,
      );
    }
    console.log(`${attendus.length} déclencheur(s) append-only en place.`);
  } finally {
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((erreur: unknown) => {
    const code = (erreur as { code?: string }).code;
    if (code === "ER_BINLOG_CREATE_ROUTINE_NEED_SUPER") {
      console.error(
        "MySQL refuse de créer un déclencheur : le compte courant n'a pas le privilège requis " +
          "et le binlog est actif. Deux issues : exécuter ce script avec un compte disposant de " +
          "SUPER, ou activer log_bin_trust_function_creators côté serveur.",
      );
      process.exit(1);
    }
    console.error(erreur instanceof Error ? erreur.message : erreur);
    process.exit(1);
  });
