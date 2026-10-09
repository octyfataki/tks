// Environnement validé au démarrage : échec rapide avec message clair
// plutôt qu'erreur obscure du driver à la première requête.
// Contrat : voir .env.example (DATABASE_URL toujours, BETTER_AUTH_SECRET
// exigé en production).

function exiger(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) {
    throw new Error(`[env] variable ${nom} manquante — voir .env.example`);
  }
  return valeur;
}

function nombrePositif(valeur: string | undefined, defaut: number): number {
  const n = Number(valeur);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : defaut;
}

export const env = {
  DATABASE_URL: exiger("DATABASE_URL"),
  LIMITE_POOL_DB: nombrePositif(process.env.LIMITE_POOL_DB, 10),
} as const;

if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
  throw new Error("[env] variable BETTER_AUTH_SECRET manquante en production");
}
