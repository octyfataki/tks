import { describe, expect, it } from "vitest";
import {
  deriverEtiquettesActives,
  type EvenementAnnotation,
} from "@/lib/annotations/derivation";

// S4 issue #7 — l'état courant se dérive du journal append-only, il ne se
// stocke pas. Le plus récent d'une paire (compte, étiquette) décide ;
// l'égalité d'horodatage se tranche par l'heure de réception.

function evenement(
  partiel: Partial<EvenementAnnotation> & { compteClientId: string },
): EvenementAnnotation {
  return {
    etiquette: "BON_PAYEUR",
    statut: "POSEE",
    horodatageLocal: new Date("2026-10-11T08:00:00Z"),
    recuLe: new Date("2026-10-11T08:00:01Z"),
    ...partiel,
  };
}

describe("S4 — dérivation des étiquettes actives", () => {
  it("une étiquette posée est active", () => {
    const actives = deriverEtiquettesActives([evenement({ compteClientId: "c1" })]);
    expect(actives.get("c1")).toEqual(["BON_PAYEUR"]);
  });

  it("le retrait annule la pose : l'écriture inverse gagne", () => {
    const actives = deriverEtiquettesActives([
      evenement({ compteClientId: "c1" }),
      evenement({
        compteClientId: "c1",
        statut: "RETIREE",
        horodatageLocal: new Date("2026-10-11T09:00:00Z"),
        recuLe: new Date("2026-10-11T09:00:01Z"),
      }),
    ]);
    expect(actives.has("c1")).toBe(false);
  });

  it("une repose après retrait réactive", () => {
    const actives = deriverEtiquettesActives([
      evenement({ compteClientId: "c1" }),
      evenement({
        compteClientId: "c1",
        statut: "RETIREE",
        horodatageLocal: new Date("2026-10-11T09:00:00Z"),
        recuLe: new Date("2026-10-11T09:00:01Z"),
      }),
      evenement({
        compteClientId: "c1",
        horodatageLocal: new Date("2026-10-11T10:00:00Z"),
        recuLe: new Date("2026-10-11T10:00:01Z"),
      }),
    ]);
    expect(actives.get("c1")).toEqual(["BON_PAYEUR"]);
  });

  it("l'ordre d'arrivée en base ne décide pas : l'horodatage local oui", () => {
    const actives = deriverEtiquettesActives([
      evenement({
        compteClientId: "c1",
        statut: "RETIREE",
        horodatageLocal: new Date("2026-10-11T09:00:00Z"),
        recuLe: new Date("2026-10-11T09:00:01Z"),
      }),
      evenement({ compteClientId: "c1" }),
    ]);
    expect(actives.has("c1")).toBe(false);
  });

  it("à horodatage local égal, la réception tranche", () => {
    const actives = deriverEtiquettesActives([
      evenement({
        compteClientId: "c1",
        statut: "RETIREE",
        recuLe: new Date("2026-10-11T08:00:02Z"),
      }),
      evenement({ compteClientId: "c1" }),
    ]);
    expect(actives.has("c1")).toBe(false);
  });

  it("une étiquette inconnue ne s'affiche jamais", () => {
    const actives = deriverEtiquettesActives([
      evenement({ compteClientId: "c1", etiquette: "MAUVAIS_PAYEUR" }),
    ]);
    expect(actives.has("c1")).toBe(false);
  });

  it("un statut inconnu ne change rien", () => {
    const actives = deriverEtiquettesActives([
      evenement({ compteClientId: "c1", statut: "PERDUE" }),
    ]);
    expect(actives.has("c1")).toBe(false);
  });

  it("dérive par compte, sans mélanger les clients", () => {
    const actives = deriverEtiquettesActives([
      evenement({ compteClientId: "c1" }),
      evenement({
        compteClientId: "c2",
        etiquette: "A_SURVEILLER",
      }),
    ]);
    expect(actives.get("c1")).toEqual(["BON_PAYEUR"]);
    expect(actives.get("c2")).toEqual(["A_SURVEILLER"]);
  });

  it("sans événement, sans étiquette", () => {
    expect(deriverEtiquettesActives([]).size).toBe(0);
  });
});
