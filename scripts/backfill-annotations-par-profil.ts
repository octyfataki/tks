import { eq, isNull } from "drizzle-orm";
import { db, fermerPool } from "../src/lib/db/client";
import { annotationsClients } from "../src/lib/db/schema/s4-annotations";
import { accesProfilClients } from "../src/lib/db/schema/s4-clients";

/**
 * Recompose les étiquettes sur le profil du shop plutôt que sur le compte de
 * connexion. Idempotent : il ne traite que les lignes encore sans profil.
 */
async function main() {
  const avant = await db
    .select({ id: annotationsClients.id })
    .from(annotationsClients);
  const aRattacher = await db
    .select({
      id: annotationsClients.id,
      compteClientId: annotationsClients.compteClientId,
    })
    .from(annotationsClients)
    .where(isNull(annotationsClients.profilClientId));

  const profilParCompte = new Map<string, string>();
  const acces = await db
    .select({
      compteClientId: accesProfilClients.compteClientId,
      profilClientId: accesProfilClients.profilClientId,
    })
    .from(accesProfilClients)
    .where(eq(accesProfilClients.statut, "ACCORDE"));
  for (const ligne of acces) {
    if (!profilParCompte.has(ligne.compteClientId)) {
      profilParCompte.set(ligne.compteClientId, ligne.profilClientId);
    }
  }

  let recAttribuees = 0;
  let sansAcces = 0;
  for (const ligne of aRattacher) {
    const profilClientId = profilParCompte.get(ligne.compteClientId);
    if (!profilClientId) {
      sansAcces += 1;
      continue;
    }
    await db
      .update(annotationsClients)
      .set({ profilClientId })
      .where(eq(annotationsClients.id, ligne.id));
    recAttribuees += 1;
  }

  const apres = await db
    .select({
      id: annotationsClients.id,
      profilClientId: annotationsClients.profilClientId,
    })
    .from(annotationsClients);

  if (apres.length !== avant.length) {
    throw new Error("Une étiquette a disparu : le backfill n'est pas réversible.");
  }

  console.log(`annotations avant      : ${avant.length}`);
  console.log(`annotations après      : ${apres.length}`);
  console.log(`rattachées au profil   : ${recAttribuees}`);
  console.log(`sans accès (laissées)  : ${sansAcces}`);
  console.log(
    `encore sans profil     : ${apres.filter((l) => !l.profilClientId).length}`,
  );
}

main()
  .catch(async (erreur) => {
    console.error(erreur);
    process.exitCode = 1;
  })
  .finally(async () => {
    await fermerPool();
  });