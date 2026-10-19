import { describe, expect, it } from "vitest";
import { jourIso } from "@/app/admin/pricing/pricing-display";

describe("affichage de la grille tarifaire", () => {
  it("date les publications au jour de Kinshasa, pas en UTC", () => {
    expect(jourIso(new Date("2026-10-19T22:59:00.000Z"))).toBe("2026-10-19");
    expect(jourIso(new Date("2026-10-19T23:30:00.000Z"))).toBe("2026-10-20");
  });
});
