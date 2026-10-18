import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db/client";
import { accesProfilClients, demandesAccesProfil, profilsClients } from "@/lib/db/schema/s4-clients";
import { comptesClients } from "@/lib/db/schema/s1-comptes";
import {
  creerProfilNouvelleBoutique,
  detecterProfilsCorrespondants,
  estProfilCandidat,
  normaliserNomBoutique,
} from "./inscription";
import { appliquerIssueApresValidation } from "./apres-validation";
import { profilAutorisePourCompte } from "./acces-profil";

describe("S3 — inscription et création du shop", () => {
  let db: Db;
  const comptes = new Set<string>();
  const profils = new Set<string>();
  const horodatage = new Date("2026-01-01T00:00:00.000Z");

  beforeAll(async () => {
    db = (await import("@/lib/db/client")).db;
  });

  afterAll(async () => {
    for (const compteClientId of comptes) {
      await db.delete(accesProfilClients).where(eq(accesProfilClients.compteClientId, compteClientId));
      await db.delete(demandesAccesProfil).where(eq(demandesAccesProfil.compteClientId, compteClientId));
      await db.delete(comptesClients).where(eq(comptesClients.id, compteClientId));
    }
    for (const profilClientId of profils) {
      await db.delete(profilsClients).where(eq(profilsClients.id, profilClientId));
    }
    const { fermerPool } = await import("@/lib/db/client");
    await fermerPool();
  });

  async function compteValide(): Promise<string> {
    const id = randomUUID();
    comptes.add(id);
    await db.insert(comptesClients).values({
      id,
      betterAuthUserId: randomUUID(),
      email: `${id}@tks.test`,
      telephone: `+2437${id.slice(0, 7)}`,
      etat: "VALIDE",
    });
    return id;
  }

  async function profilExistant(nom: string, contact: string): Promise<string> {
    const id = await creerProfilNouvelleBoutique({
      compteClientId: randomUUID(),
      nom,
      contactTelephone: contact,
      plafondMontant: 200,
      plafondDevise: "USD",
      horodatageLocal: horodatage,
    });
    profils.add(id);
    return id;
  }

  describe("comparaison de noms", () => {
    it("ignore casse, accents et ponctuation", () => {
      expect(normaliserNomBoutique("Boutique Mukendi")).toBe(
        normaliserNomBoutique("  BOUTIQUE-mukendi "),
      );
      expect(normaliserNomBoutique("Épice Marché")).toBe(
        normaliserNomBoutique("epice marche"),
      );
    });

    it("ne confond pas deux boutiques de noms différents", () => {
      expect(estProfilCandidat({ nom: "Boutique Mukendi", contactTelephone: "+2431" }, {
        nom: "Boutique Kasongo",
        contactTelephone: "+2432",
      })).toBe(false);
    });
  });

  it("crée le profil d'une boutique nouvelle et lui donne l'accès à la validation", async () => {
    const compteClientId = await compteValide();
    const profilClientId = await creerProfilNouvelleBoutique({
      compteClientId,
      nom: "Boutique Nouvelle",
      contactTelephone: `+2439${compteClientId.slice(0, 7)}`,
      plafondMontant: 200,
      plafondDevise: "USD",
      horodatageLocal: horodatage,
    });
    profils.add(profilClientId);

    await expect(profilAutorisePourCompte(compteClientId)).resolves.toBeNull();

    const issue = await appliquerIssueApresValidation({
      compteClientId,
      acteurId: "acteur-test",
      roleAuMoment: "AGENT",
      horodatageLocal: horodatage,
    });

    expect(issue.statut).toBe("ACCES_AUTOMATIQUE");
    await expect(profilAutorisePourCompte(compteClientId)).resolves.toEqual({
      profilClientId,
    });
  });

  it("ne crée pas de doublon et n'accorde rien quand un profil correspond déjà", async () => {
    const existant = await profilExistant("Boutique Reconnue", "+243811222333");

    const compteClientId = await compteValide();
    await db
      .update(comptesClients)
      .set({ profilCandidatId: existant })
      .where(eq(comptesClients.id, compteClientId));

    const issue = await appliquerIssueApresValidation({
      compteClientId,
      acteurId: "acteur-test",
      roleAuMoment: "AGENT",
      horodatageLocal: horodatage,
    });

    expect(issue.statut).toBe("A_CONFIRMER");
    await expect(profilAutorisePourCompte(compteClientId)).resolves.toBeNull();

    const demandes = await db
      .select()
      .from(demandesAccesProfil)
      .where(eq(demandesAccesProfil.compteClientId, compteClientId));
    expect(demandes).toHaveLength(1);
    expect(demandes[0].profilClientId).toBe(existant);
  });

  it("détecte une correspondance par contact et par nom", async () => {
    const parContact = await profilExistant("Boutique Alpha", "+243811444555");
    const parNom = await profilExistant("Boutique Beta", "+243811666777");

    await expect(
      detecterProfilsCorrespondants({
        nom: "Boutique Gamma",
        contactTelephone: "+243811444555",
      }),
    ).resolves.toContain(parContact);

    await expect(
      detecterProfilsCorrespondants({
        nom: "  boutique   BETA ",
        contactTelephone: "+243811999000",
      }),
    ).resolves.toContain(parNom);
  });

  it("ne renvoie que des identifiants, jamais de nom ni de solde", async () => {
    await profilExistant("Boutique Secrete", "+243811123123");
    const detectes = await detecterProfilsCorrespondants({
      nom: "Boutique Secrete",
      contactTelephone: "+243811123123",
    });
    for (const detecte of detectes) {
      expect(typeof detecte).toBe("string");
      expect(detecte.length).toBe(36);
    }
  });

  it("ne donne pas accès à un compte encore non validé", async () => {
    const compteClientId = randomUUID();
    comptes.add(compteClientId);
    await db.insert(comptesClients).values({
      id: compteClientId,
      betterAuthUserId: randomUUID(),
      email: `${compteClientId}@tks.test`,
      telephone: `+2436${compteClientId.slice(0, 7)}`,
      etat: "EN_ATTENTE_VALIDATION",
    });
    const profilClientId = await creerProfilNouvelleBoutique({
      compteClientId,
      nom: "Boutique En Attente",
      contactTelephone: `+2435${compteClientId.slice(0, 7)}`,
      plafondMontant: 200,
      plafondDevise: "USD",
      horodatageLocal: horodatage,
    });
    profils.add(profilClientId);

    await expect(profilAutorisePourCompte(compteClientId)).rejects.toMatchObject({
      code: "COMPTE_NON_VALIDE",
    });
  });
});