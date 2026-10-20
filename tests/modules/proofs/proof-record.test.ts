import { describe, expect, it } from "vitest";
import { OrderError } from "@/modules/orders/order-record";
import {
  isPendingProof,
  prepareRefusal,
  prepareValidation,
  REFUSAL_MAX,
} from "@/modules/proofs/proof-record";

describe("preuve de paiement", () => {
  it("exige un motif de refus d'au moins trois caractères", () => {
    expect(() => prepareRefusal("")).toThrow(OrderError);
    expect(() => prepareRefusal("  ok  ")).toThrow(OrderError);
  });

  it("nettoie le motif et le borne", () => {
    expect(prepareRefusal("  capture illisible  ")).toBe("capture illisible");
    expect(prepareRefusal("x".repeat(REFUSAL_MAX + 50))).toHaveLength(
      REFUSAL_MAX,
    );
  });

  it("ne tranche qu'une preuve encore en attente", () => {
    expect(isPendingProof("PENDING")).toBe(true);
    expect(() => prepareValidation("PENDING")).not.toThrow();
    expect(() => prepareValidation("VALIDATED")).toThrow(OrderError);
    expect(() => prepareValidation("REFUSED")).toThrow(OrderError);
  });
});
