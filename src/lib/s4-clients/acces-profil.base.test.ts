import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db/client";
import { accesProfilClients, demandesAccesProfil, profilsClients } from "@/lib/db/schema/s4-clients";
import { comptesClients, comptesStaff } from "@/lib/db/schema/s1-comptes";
import { journalAudit } from "@/lib/db/schema/s2-autorisations";
import { permissionsAgents } from "@/lib/db/schema/s2-autorisations";
import {
  AccesProfilError,
  confirmerAccesProfil,
  creerDemandeAcces,
  profilAutorisePourCompte,
  revoquerAccesProfil,
  refuserDemandeAcces,
} from "@/lib/s4-clients/acces-profil";

const PERMISSIONS_SENSIBLES = [
  "client.acces_confirmer",
  "client.acces_revoquer",
];

describe("S4 — accès au profil existant", () => {
  const comptes = new Set<string>();
  let db: Db;
  const staffs = new Set<string>();
  const horodatage = new Date("2026-01-01T00:00:00.000Z");

  function compteValide(): string {
    const id = randomUUID();
    comptes.add(id);
    return id;
  }

  function compteSuspendu(): string {
    const id = randomUUID();
    comptes.add(id);
    return id;
  }

  async function agentAvec(permission: string | null): Promise<string> {
    const id = randomUUID();
    staffs.add(id);
    await db.insert(comptesStaff).values({
      id,
      betterAuthUserId: randomUUID(),
      email: `${id}@tks.test`,
      role: "AGENT",
      etat: "VALIDE",
    });
    if (permission) {
      await db.insert(permissionsAgents).values({
        agentId: id,
        permission,
        accordePar: "bootstrap",
      });
    }
    return id;
  }

  async function profil(): Promise<string> {
    const id = randomUUID();
    await db.insert(profilsClients).values({
      id,
      nom: "Boutique test",
      contactTelephone: `+2439${id.slice(0, 6)}`,
      plafondMontant: 100,
      plafondDevise: "USD",
      creePar: "test",
      horodatageLocal: horodatage,
    });
    return id;
  }

  beforeAll(async () => {
    const client = await import("@/lib/db/client");
    db = client.db;
    const { permissionsSocleAgents } = await import(
      "@/lib/db/schema/s2-autorisations"
    );
    await db
      .delete(permissionsSocleAgents)
      .where(inArray(permissionsSocleAgents.permission, PERMISSIONS_SENSIBLES));
  });

  afterAll(async () => {
    for (const staffId of staffs) {
      await db
        .delete(permissionsAgents)
        .where(eq(permissionsAgents.agentId, staffId));
      await db.delete(comptesStaff).where(eq(comptesStaff.id, staffId));
    }
    for (const compteId of comptes) {
      await db.delete(accesProfilClients).where(
        eq(accesProfilClients.compteClientId, compteId),
      );
      await db.delete(demandesAccesProfil).where(
        eq(demandesAccesProfil.compteClientId, compteId),
      );
      await db.delete(comptesClients).where(eq(comptesClients.id, compteId));
    }
    const { fermerPool } = await import("@/lib/db/client");
    await fermerPool();
  });

  async function compteEtProfil(etat: "VALIDE" | "EN_ATTENTE_VALIDATION" = "VALIDE") {
    const compteClientId =
      etat === "VALIDE" ? compteValide() : compteSuspendu();
    await db.insert(comptesClients).values({
      id: compteClientId,
      betterAuthUserId: randomUUID(),
      email: `${compteClientId}@tks.test`,
      telephone: `+2438${compteClientId.slice(0, 6)}`,
      etat,
    });
    const profilClientId = await profil();
    return { compteClientId, profilClientId };
  }

  it("refuse l'accès à un compte non validé, dès l'ouverture de la demande", async () => {
    const { compteClientId, profilClientId } = await compteEtProfil(
      "EN_ATTENTE_VALIDATION",
    );

    await expect(
      creerDemandeAcces({
        compteClientId,
        profilClientId,
        horodatageLocal: horodatage,
      }),
    ).rejects.toMatchObject({ code: "COMPTE_NON_VALIDE" });

    await expect(profilAutorisePourCompte(compteClientId)).rejects.toMatchObject({
      code: "COMPTE_NON_VALIDE",
    });
  });

  it("refuse la confirmation à un agent sans permission", async () => {
    const { compteClientId, profilClientId } = await compteEtProfil();
    const agent = await agentAvec(null);
    const { demandeId } = await creerDemandeAcces({
      compteClientId,
      profilClientId,
      horodatageLocal: horodatage,
    });

    await expect(
      confirmerAccesProfil({ demandeId, agentId: agent, horodatageLocal: horodatage }),
    ).rejects.toMatchObject({ code: "PERMISSION_INSUFFISANTE" });

    await expect(
      profilAutorisePourCompte(compteClientId),
    ).resolves.toBeNull();
  });

  it("n'accorde rien avant confirmation, même pour un profil existant", async () => {
    const { compteClientId, profilClientId } = await compteEtProfil();
    await creerDemandeAcces({
      compteClientId,
      profilClientId,
      horodatageLocal: horodatage,
    });

    await expect(profilAutorisePourCompte(compteClientId)).resolves.toBeNull();
  });

  it("accorde l'accès après confirmation et le journalise", async () => {
    const { compteClientId, profilClientId } = await compteEtProfil();
    const agent = await agentAvec("client.acces_confirmer");
    const { demandeId } = await creerDemandeAcces({
      compteClientId,
      profilClientId,
      horodatageLocal: horodatage,
    });

    await confirmerAccesProfil({ demandeId, agentId: agent, horodatageLocal: horodatage });

    await expect(profilAutorisePourCompte(compteClientId)).resolves.toEqual({
      profilClientId,
    });

    const evenements = await db
      .select()
      .from(journalAudit)
      .where(eq(journalAudit.entiteId, demandeId));
    expect(evenements.length).toBeGreaterThan(0);
  });

  it("exige un motif lisible pour refuser", async () => {
    const { compteClientId, profilClientId } = await compteEtProfil();
    const agent = await agentAvec("client.acces_confirmer");
    const { demandeId } = await creerDemandeAcces({
      compteClientId,
      profilClientId,
      horodatageLocal: horodatage,
    });

    await expect(
      refuserDemandeAcces({ demandeId, agentId: agent, motif: "", horodatageLocal: horodatage }),
    ).rejects.toBeInstanceOf(AccesProfilError);

    await expect(
      profilAutorisePourCompte(compteClientId),
    ).resolves.toBeNull();
  });

  it("révoque un accès accordé sans toucher à la demande", async () => {
    const { compteClientId, profilClientId } = await compteEtProfil();
    const agent = await agentAvec("client.acces_confirmer");
    const { demandeId } = await creerDemandeAcces({
      compteClientId,
      profilClientId,
      horodatageLocal: horodatage,
    });
    await confirmerAccesProfil({ demandeId, agentId: agent, horodatageLocal: horodatage });

    const acces = await db
      .select()
      .from(accesProfilClients)
      .where(eq(accesProfilClients.compteClientId, compteClientId));
    const revokeur = await agentAvec("client.acces_revoquer");

    await revoquerAccesProfil({
      accesId: acces[0].id,
      agentId: revokeur,
      motif: "erreur de saisie au comptoir",
      horodatageLocal: horodatage,
    });

    await expect(profilAutorisePourCompte(compteClientId)).resolves.toBeNull();

    const restantes = await db
      .select()
      .from(demandesAccesProfil)
      .where(
        and(
          eq(demandesAccesProfil.id, demandeId),
          eq(demandesAccesProfil.statut, "ACCORDEE"),
        ),
      );
    expect(restantes).toHaveLength(1);
  });

  it("n'autorise pas un agent sans permission de révoquer", async () => {
    const { compteClientId, profilClientId } = await compteEtProfil();
    const agent = await agentAvec("client.acces_confirmer");
    const { demandeId } = await creerDemandeAcces({
      compteClientId,
      profilClientId,
      horodatageLocal: horodatage,
    });
    await confirmerAccesProfil({ demandeId, agentId: agent, horodatageLocal: horodatage });
    const acces = await db
      .select()
      .from(accesProfilClients)
      .where(eq(accesProfilClients.compteClientId, compteClientId));

    await expect(
      revoquerAccesProfil({
        accesId: acces[0].id,
        agentId: agent,
        motif: "tentative sans permission",
        horodatageLocal: horodatage,
      }),
    ).rejects.toMatchObject({ code: "PERMISSION_INSUFFISANTE" });

    await expect(profilAutorisePourCompte(compteClientId)).resolves.toEqual({
      profilClientId,
    });
  });
});