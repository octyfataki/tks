import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import mysql from "mysql2/promise";
import { hashPassword } from "better-auth/crypto";

const envFile = join(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

async function main() {
  const motDePasse = process.env.DEV_MDP_COMMUN;
  const comptes = (process.env.DEV_COMPTES ?? "")
    .split(",")
    .map((entree) => entree.trim())
    .filter((entree) => entree !== "");
  if (!motDePasse) {
    throw new Error("Variable requise : DEV_MDP_COMMUN");
  }
  if (comptes.length === 0) {
    throw new Error(
      "Variable requise : DEV_COMPTES (adresses séparées par des virgules)",
    );
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL absente : renseigne .env.local.");
  }
  const connexion = await mysql.createConnection(url);
  try {
    const empreinte = await hashPassword(motDePasse);
    for (const email of comptes) {
      const [users] = (await connexion.query(
        "SELECT id FROM user WHERE email = ?",
        [email],
      )) as [Array<{ id: string }>, unknown];
      if (users.length === 0) {
        console.log(`Compte absent, ignoré : ${email}`);
        continue;
      }
      await connexion.query(
        "UPDATE account SET password = ?, updated_at = NOW() WHERE user_id = ? AND provider_id = 'credential'",
        [empreinte, users[0].id],
      );
      console.log(`Mot de passe commun appliqué : ${email}`);
    }
  } finally {
    await connexion.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
