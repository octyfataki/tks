/**
 * Bootstrap du tout premier compte : l'ADMIN_TECHNIQUE du développeur.
 * Refusé dès qu'un compte staff existe (voir bootstrapAdminTechnique).
 *
 * Usage :
 *   BOOTSTRAP_ADMIN_EMAIL=moi@exemple.cd BOOTSTRAP_ADMIN_PASSWORD=... pnpm db:bootstrap-technical-admin
 *
 * La suite (création du compte ADMIN_PRINCIPAL du distributeur) se fait par
 * cet admin technique via creerAdminPrincipal — jamais par import (S10).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { bootstrapAdminTechnique } from "../src/lib/s1-comptes/staff";

// Charge .env.local sans dépendance (tsx n'inclut pas dotenv).
const envFile = join(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME ?? "Admin technique";
  if (!email || !password) {
    throw new Error(
      "Variables requises : BOOTSTRAP_ADMIN_EMAIL et BOOTSTRAP_ADMIN_PASSWORD",
    );
  }
  const res = await bootstrapAdminTechnique({ email, password, name });
  console.log(`ADMIN_TECHNIQUE créé : compte_staff ${res.id} (${email})`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
