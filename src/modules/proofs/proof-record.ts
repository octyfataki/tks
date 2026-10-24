import { OrderError } from "@/modules/orders/order-record";

export const PROOF_STATUSES = ["PENDING", "VALIDATED", "REFUSED"] as const;
export type ProofStatus = (typeof PROOF_STATUSES)[number];

export const REFUSAL_MIN = 3;
export const REFUSAL_MAX = 500;

export function isProofStatus(value: string): value is ProofStatus {
  return (PROOF_STATUSES as readonly string[]).includes(value);
}

export function isPendingProof(status: string): boolean {
  return status === "PENDING";
}

export function prepareRefusal(reason: unknown): string {
  const motif = typeof reason === "string" ? reason.trim() : "";
  if (motif.length < REFUSAL_MIN) {
    throw new OrderError(
      "REASON_REQUIRED",
      `Motif obligatoire : ${REFUSAL_MIN} caractères au moins, pour que le client sache quoi corriger.`,
    );
  }
  return motif.slice(0, REFUSAL_MAX);
}

export function prepareValidation(status: string): void {
  if (!isPendingProof(status)) {
    throw new OrderError(
      "STALE_STATE",
      "Cette preuve a déjà été tranchée : elle ne se révise ni ne s'écrase.",
    );
  }
}
