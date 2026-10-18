import { describe, expect, it } from "vitest";
import {
  DossierError,
  dossierCorrespond,
  preparerCreationDossier,
  type DossierResume,
} from "./client-record";

const BASE = {
  nom: "Alimentation Chez Marie",
  contact: "+243815000000",
  adresse: "12, avenue de la Nation, Kinshasa",
};

describe("préparer une ouverture de dossier", () => {
  it("canonise le contact : deux écritures du même numéro sont identiques", () => {
    const premier = preparerCreationDossier({ ...BASE, contact: "+243 815 000 000" });
    const second = preparerCreationDossier({ ...BASE, contact: "00243815000000" });
    expect(premier.contact).toBe("+243815000000");
    expect(second.contact).toBe(premier.contact);
  });

  it("refuse un nom trop court, un contact invalide, une adresse vide", () => {
    expect(() => preparerCreationDossier({ ...BASE, nom: "A" })).toThrowError(
      DossierError,
    );
    expect(() =>
      preparerCreationDossier({ ...BASE, contact: "pas-un-numero" }),
    ).toThrowError(DossierError);
    expect(() => preparerCreationDossier({ ...BASE, adresse: " " })).toThrowError(
      DossierError,
    );
  });

  it("génère un identifiant d'appareil quand aucun n'est fourni", () => {
    const prepare = preparerCreationDossier(BASE);
    expect(prepare.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(prepare.horodatageLocal).toBeInstanceOf(Date);
  });
});

describe("deux homonymes restent deux dossiers", () => {
  const kinshasa: DossierResume = {
    id: "dossier-kin",
    nom: "Alimentation Chez Marie",
    contact: "+243815000000",
    adresse: "12, avenue de la Nation, Kinshasa",
  };
  const lubumbashi: DossierResume = {
    id: "dossier-lshi",
    nom: "Alimentation Chez Marie",
    contact: "+243997000000",
    adresse: "8, avenue Kasa-Vubu, Lubumbashi",
  };

  it("la recherche par nom renvoie les deux, jamais un seul", () => {
    expect(dossierCorrespond(kinshasa, "alimentation marie")).toBe(true);
    expect(dossierCorrespond(lubumbashi, "alimentation marie")).toBe(true);
  });

  it("le contact affine sans fusionner : chacun garde sa dette", () => {
    expect(dossierCorrespond(kinshasa, "marie 815")).toBe(true);
    expect(dossierCorrespond(lubumbashi, "marie 815")).toBe(false);
  });
});

describe("un contact partagé est accepté, jamais un raccourci", () => {
  it("préparer avec un contact déjà porté par un autre dossier réussit", () => {
    const prepare = preparerCreationDossier({
      nom: "Quincaillerie du Marché",
      contact: "+243815000000",
      adresse: "3, rue du Commerce, Kinshasa",
    });
    expect(prepare.contact).toBe("+243815000000");
  });

  it("la recherche par numéro propose tous les dossiers qui le portent", () => {
    const premier: DossierResume = { ...BASE, id: "a" } as DossierResume;
    const second: DossierResume = {
      id: "b",
      nom: "Quincaillerie du Marché",
      contact: "+243815000000",
      adresse: "3, rue du Commerce, Kinshasa",
    };
    expect(dossierCorrespond(premier, "+243815000000")).toBe(true);
    expect(dossierCorrespond(second, "+243815000000")).toBe(true);
  });
});
