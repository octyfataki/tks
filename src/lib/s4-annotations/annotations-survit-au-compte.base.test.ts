import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db/client";
import { accesProfilClients, profilsClients } from "@/lib/db/schema/s4-clients";
import { annotationsClients } from "@/lib/db/schema/s4-annotations";
import { comptesClients } from "@/lib/db/schema/s1-comptes";
import { confirmerAccesProfil, creerDemandeAcces } from "@/lib/s4-clients/acces-profil";
import { etiquettesActivesParProfil, poserEtiquette } from "@/lib/s4-annotations/annotations";

describe("S5 — les données du shop survivent au changement de compte", () => {
  let db: Db;
  const comptes = new Set<string>();
  const horodatage = new Date("2026-01-01T00:00:00.000Z");
  let profilClientId: string;

  beforeAll(async () => {
    const client = await import("@/lib/db/client");
    db = client.db;
  });

  afterAll(async () => {
    for (const compteClientId of comptes) {
      await db.delete(annotationsClients).where(
        eq(annotationsClients.compteClientId, compteClientId),
      );
      await db.delete(accesProfilClients).where(
        eq(accesProfilClients.compteClientId, compteClientId),
      );
      await db.delete(comptesClients).where(eq(comptesClients.id, compteClientId));
    }
    await db.delete(profilsClients).where(eq(profilsClients.id, profilClientId));
    const { fermerPool } = await import("@/lib/db/client");
    await fermerPool();
  });

  async function compteValide(numero: string): Promise<string> {
    const id = randomUUID();
    comptes.add(id);
    await db.insert(comptesClients).values({
      id,
      betterAuthUserId: randomUUID(),
      email: `${id}@tks.test`,
      telephone: numero,
      etat: "VALIDE",
    });
    return id;
  }

  async function agentConfirmeur(): Promise<string> {
    const { comptesStaff } = await import("@/lib/db/schema/s1-comptes");
    const { permissionsAgents } = await import("@/lib/db/schema/s2-autorisations");
    const agentId = randomUUID();
    await db.insert(comptesStaff).values({
      id: agentId,
      betterAuthUserId: randomUUID(),
      email: `${agentId}@tks.test`,
      role: "AGENT",
      etat: "VALIDE",
    });
    await db.insert(permissionsAgents).values({
      agentId,
      permission: "client.acces_confirmer",
      accordePar: "test",
    });
    return agentId;
  }

  it("conserve les étiquettes du shop quand le compte est remplacé", async () => {
    profilClientId = randomUUID();
    await db.insert(profilsClients).values({
      id: profilClientId,
      nom: "Boutique durable",
      contactTelephone: "+243811000111",
      plafondMontant: 200,
      plafondDevise: "USD",
      creePar: "test",
      horodatageLocal: horodatage,
    });

    const agentId = await agentConfirmeur();
    const ancien = await compteValide("+243811000001");

    const { demandeId } = await creerDemandeAcces({
      compteClientId: ancien,
      profilClientId,
      horodatageLocal: horodatage,
    });
    await confirmerAccesProfil({ demandeId, agentId, horodatageLocal: horodatage });

    await poserEtiquette({
      acteurId: agentId,
      roleAuMoment: "AGENT",
      compteClientId: ancien,
      etiquette: "BON_PAYEUR",
      horodatageLocal: horodatage,
    });

    await expect(etiquettesActivesParProfil([profilClientId])).resolves.toEqual(
      new Map([[profilClientId, ["BON_PAYEUR"]]]),
    );

    const nouveau = await compteValide("+243811000999");
    const accesActuel = await db
      .select({ id: accesProfilClients.id })
      .from(accesProfilClients)
      .where(eq(accesProfilClients.compteClientId, ancien));
    const { revoquerAccesProfil } = await import("@/lib/s4-clients/acces-profil");
    const { permissionsAgents } = await import("@/lib/db/schema/s2-autorisations");
    await db.insert(permissionsAgents).values({
      agentId,
      permission: "client.acces_revoquer",
      accordePar: "test",
    });
    await revoquerAccesProfil({
      accesId: accesActuel[0].id,
      agentId,
      motif: "telephone perdu, nouveau compte cree",
      horodatageLocal: horodatage,
    });

    const secondeDemande = await creerDemandeAcces({
      compteClientId: nouveau,
      profilClientId,
      horodatageLocal: horodatage,
    });
    await confirmerAccesProfil({
      demandeId: secondeDemande.demandeId,
      agentId,
      horodatageLocal: horodatage,
    });

    await expect(etiquettesActivesParProfil([profilClientId])).resolves.toEqual(
      new Map([[profilClientId, ["BON_PAYEUR"]]]),
    );

    const total = await db
      .select()
      .from(annotationsClients)
      .where(eq(annotationsClients.profilClientId, profilClientId));
    expect(total).toHaveLength(1);
  });

  it("n'attache rien au profil quand le compte n'a pas d'accès", async () => {
    const sansAcces = await compteValide("+243811000777");
    const agentId = await agentConfirmeur();
    await poserEtiquette({
      acteurId: agentId,
      roleAuMoment: "AGENT",
      compteClientId: sansAcces,
      etiquette: "BON_PAYEUR",
      horodatageLocal: horodatage,
    });

    const lignes = await db
      .select({ profilClientId: annotationsClients.profilClientId })
      .from(annotationsClients)
      .where(eq(annotationsClients.compteClientId, sansAcces));
    expect(lignes[0].profilClientId).toBeNull();
  });
});