import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db/client";
import { accesProfilClients } from "@/lib/db/schema/s4-clients";

const baseDisponible = Boolean(process.env.DATABASE_URL);

function accesAccorde(profilClientId: string, compteClientId: string) {
  return {
    id: randomUUID(),
    compteClientId,
    profilClientId,
    statut: "ACCORDE" as const,
    decidePar: "acteur-test",
    horodatageLocal: new Date("2026-01-01T00:00:00.000Z"),
  };
}

function accesRevoque(profilClientId: string, compteClientId: string) {
  return {
    ...accesAccorde(profilClientId, compteClientId),
    statut: "REVOKE" as const,
    motif: "erreur de saisie au comptoir",
  };
}

describe.skipIf(!baseDisponible)(
  "S4 — la base refuse deux accès actifs, sans l'aide de l'application",
  () => {
    const comptesCrees = new Set<string>();
    let db: Db;
    let fermerPool: () => Promise<void>;

    function compte() {
      const compteClientId = randomUUID();
      comptesCrees.add(compteClientId);
      return compteClientId;
    }

    beforeAll(async () => {
      const client = await import("@/lib/db/client");
      db = client.db;
      fermerPool = client.fermerPool;
    });

    afterAll(async () => {
      for (const compteClientId of comptesCrees) {
        await db
          .delete(accesProfilClients)
          .where(eq(accesProfilClients.compteClientId, compteClientId));
      }
      await fermerPool();
    });

    it("refuse un second accès actif pour le même compte", async () => {
      const compteClientId = compte();
      await db
        .insert(accesProfilClients)
        .values(accesAccorde(randomUUID(), compteClientId));

      await expect(
        db
          .insert(accesProfilClients)
          .values(accesAccorde(randomUUID(), compteClientId)),
      ).rejects.toThrow();
    });

    it("refuse un second compte actif sur le même profil", async () => {
      const profilClientId = randomUUID();
      await db
        .insert(accesProfilClients)
        .values(accesAccorde(profilClientId, compte()));

      await expect(
        db
          .insert(accesProfilClients)
          .values(accesAccorde(profilClientId, compte())),
      ).rejects.toThrow();
    });

    it("libère le profil après révocation, sans effacer la ligne", async () => {
      const profilClientId = randomUUID();
      const initial = accesAccorde(profilClientId, compte());
      await db.insert(accesProfilClients).values(initial);

      await db
        .update(accesProfilClients)
        .set({ statut: "REVOKE", motif: "erreur de saisie au comptoir" })
        .where(eq(accesProfilClients.id, initial.id));

      await expect(
        db
          .insert(accesProfilClients)
          .values(accesAccorde(profilClientId, compte())),
      ).resolves.toBeDefined();

      const lignes = await db
        .select()
        .from(accesProfilClients)
        .where(eq(accesProfilClients.id, initial.id));
      expect(lignes).toHaveLength(1);
      expect(lignes[0].statut).toBe("REVOKE");
      expect(lignes[0].motif).toBe("erreur de saisie au comptoir");
    });

    it("conserve l'historique : plusieurs révoquations d'un même compte coexistent", async () => {
      const compteClientId = compte();
      await db.insert(accesProfilClients).values([
        accesRevoque(randomUUID(), compteClientId),
        accesRevoque(randomUUID(), compteClientId),
      ]);

      const lignes = await db
        .select()
        .from(accesProfilClients)
        .where(eq(accesProfilClients.compteClientId, compteClientId));
      expect(lignes).toHaveLength(2);
    });

    it("ne laisse aucun téléphone servir de clé d'accès", async () => {
      const lignes = await db.select().from(accesProfilClients).limit(1);
      expect(Object.keys(lignes[0] ?? { id: "" })).not.toContain("telephone");
    });
  },
);