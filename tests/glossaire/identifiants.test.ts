import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TYPES_PIECE } from "@/lib/accounts/document-files";
import { STATUTS_PIECE } from "@/lib/accounts/client-record";
import { ETIQUETTES_FERMEES } from "@/lib/annotations/labels";
import { STATUTS_ANNOTATION } from "@/lib/db/schema/annotations/annotations";
import {
  ETATS_CLIENT,
  ETATS_LIEN_INVITATION,
  ETATS_STAFF,
  ROLES_STAFF,
} from "@/lib/db/schema/accounts/validation";
import { PERMISSIONS_FERMEES } from "@/lib/db/schema/authorizations/validation";
import {
  DEVISES_PLAFOND,
  STATUTS_PROFIL,
} from "@/lib/db/schema/clients/profils-clients";

type Ligne = {
  portee: string;
  terme: string;
  identifiant: string;
};

const LISTES_METIER: ReadonlyArray<{
  portee: string;
  valeurs: readonly string[];
}> = [
  { portee: "client_account.state", valeurs: ETATS_CLIENT },
  { portee: "staff_account.state", valeurs: ETATS_STAFF },
  { portee: "staff_account.role", valeurs: ROLES_STAFF },
  { portee: "client_profile.credit_status", valeurs: STATUTS_PROFIL },
  {
    portee: "annotation.label",
    valeurs: ETIQUETTES_FERMEES.map((etiquette) => etiquette.code),
  },
  { portee: "annotation.state", valeurs: STATUTS_ANNOTATION },
  { portee: "staff.permission", valeurs: PERMISSIONS_FERMEES },
  { portee: "currency", valeurs: DEVISES_PLAFOND },
  { portee: "identity_document.verdict", valeurs: STATUTS_PIECE },
  { portee: "identity_document.kind", valeurs: TYPES_PIECE },
  { portee: "invitation_link.state", valeurs: ETATS_LIEN_INVITATION },
];

const LIGNE_TABLE =
  /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*$/;

const IDENTIFIANT_MAJUSCULES = /^[A-Z][A-Z0-9_]*$/;
const IDENTIFIANT_POINTE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;
const IDENTIFIANT_MINUSCULES = /^[a-z][a-z0-9]*$/;

function tableDeCorrespondance(): Ligne[] {
  const glossaire = readFileSync(resolve(process.cwd(), "GLOSSARY.md"), "utf-8");
  return glossaire
    .split("\n")
    .map((ligne) => ligne.match(LIGNE_TABLE))
    .filter((trouve): trouve is RegExpMatchArray => trouve !== null)
    .map((trouve) => ({
      portee: trouve[1],
      terme: trouve[2],
      identifiant: trouve[3],
    }));
}

describe("Vocabulaire — la table de correspondance du glossaire", () => {
  const table = tableDeCorrespondance();

  it("existe et n'est pas vide", () => {
    expect(table.length).toBeGreaterThan(20);
  });

  it("couvre chaque valeur métier déclarée en code", () => {
    const parPortee = new Map<string, string[]>();
    for (const ligne of table) {
      const termes = parPortee.get(ligne.portee) ?? [];
      termes.push(ligne.terme);
      parPortee.set(ligne.portee, termes);
    }

    for (const liste of LISTES_METIER) {
      const termes = parPortee.get(liste.portee) ?? [];
      expect(termes.length, `portée absente : ${liste.portee}`).toBeGreaterThan(
        0,
      );
      for (const valeur of liste.valeurs) {
        expect(termes, `${liste.portee} : ${valeur}`).toContain(valeur);
      }
    }
  });

  it("ne déclare qu'une fois un terme dans une portée", () => {
    const vues = new Set<string>();
    for (const ligne of table) {
      const cle = `${ligne.portee}\u0000${ligne.terme}`;
      expect(vues.has(cle), cle).toBe(false);
      vues.add(cle);
    }
  });

  it("ne donne qu'un identifiant à une portée pour un même terme", () => {
    const vues = new Set<string>();
    for (const ligne of table) {
      const cle = `${ligne.portee}\u0000${ligne.identifiant}`;
      expect(vues.has(cle), cle).toBe(false);
      vues.add(cle);
    }
  });

  it("traduit toujours un même terme français de la même façon", () => {
    const identifiants = new Map<string, string>();
    for (const ligne of table) {
      const connu = identifiants.get(ligne.terme);
      expect(
        connu === undefined || connu === ligne.identifiant,
        `${ligne.terme} : ${connu} puis ${ligne.identifiant}`,
      ).toBe(true);
      identifiants.set(ligne.terme, ligne.identifiant);
    }
  });

  it("écrit l'identifiant dans la forme du terme qu'il remplace", () => {
    for (const ligne of table) {
      const forme = ligne.terme.includes(".")
        ? IDENTIFIANT_POINTE
        : ligne.terme.includes("-") || /^[a-z]/.test(ligne.terme)
          ? IDENTIFIANT_MINUSCULES
          : IDENTIFIANT_MAJUSCULES;
      expect(
        ligne.identifiant,
        `${ligne.portee} : ${ligne.terme} → ${ligne.identifiant}`,
      ).toMatch(forme);
    }
  });

  it("n'écrit jamais un terme français comme identifiant d'un autre terme", () => {
    const francais = new Set(table.map((ligne) => ligne.terme));
    for (const ligne of table) {
      if (francais.has(ligne.identifiant)) {
        expect(
          ligne.identifiant,
          `${ligne.portee} : ${ligne.terme} → ${ligne.identifiant}`,
        ).toBe(ligne.terme);
      }
    }
  });

  it("porte la règle qui interdit le français en base", () => {
    const glossaire = readFileSync(resolve(process.cwd(), "GLOSSARY.md"), "utf-8");
    expect(glossaire).toContain("**La base ne stocke que l'identifiant.**");
  });
});
