import { describe, expect, it } from "vitest";
import {
  billedAmount,
  deriveOrder,
  initialState,
  LOCK_TTL_MS,
  nextState,
  OrderError,
  ORDER_EVENT_KINDS,
  ORDER_STATES,
  prepareOrder,
  resolveQuantity,
  unitsForBilledAmount,
  type OrderEventKind,
  type OrderEventRecord,
  type OrderState,
} from "@/modules/orders/order-record";

const VALID: Record<OrderState, Partial<Record<OrderEventKind, OrderState>>> = {
  AWAITING_PROOF: {
    PROOF_SUBMITTED: "AWAITING_PROOF",
    PROOF_VALIDATED: "QUEUED",
    PROOF_REFUSED: "AWAITING_PROOF",
    CANCELLED: "CANCELLED",
  },
  QUEUED: {
    LOCKED: "LOCKED",
    CANCELLED: "CANCELLED",
  },
  LOCKED: {
    SERVED: "SERVED",
    CANCELLED: "CANCELLED",
  },
  SERVED: {},
  CANCELLED: {},
};

function event(
  kind: OrderEventKind,
  overrides: Partial<OrderEventRecord> = {},
): OrderEventRecord {
  return {
    kind,
    actorId: "agent-1",
    localTimestamp: new Date("2026-10-20T10:00:00.000Z"),
    ...overrides,
  };
}

const creation = event("CREATED", {
  payload: { channel: "ONLINE", type: "PREPAID" },
});

describe("état déduit des événements", () => {
  it("une commande en ligne prépayée attend la preuve", () => {
    expect(initialState("ONLINE", "PREPAID")).toBe("AWAITING_PROOF");
    expect(initialState("ONLINE", "CREDIT")).toBe("QUEUED");
    expect(initialState("COUNTER", "PREPAID")).toBe("QUEUED");
    expect(initialState("COUNTER", "CREDIT")).toBe("QUEUED");
  });

  it("couvre les 35 combinaisons état × événement", () => {
    for (const state of ORDER_STATES) {
      for (const kind of ORDER_EVENT_KINDS) {
        expect(nextState(state, kind), `${state} + ${kind}`).toBe(
          VALID[state][kind] ?? null,
        );
      }
    }
  });

  it("suit le parcours complet d'une commande en ligne prépayée", () => {
    const maintenant = new Date("2026-10-20T10:20:00.000Z");
    const derived = deriveOrder(
      [
        creation,
        event("PROOF_SUBMITTED", {
          actorId: null,
          localTimestamp: new Date("2026-10-20T10:02:00.000Z"),
          payload: { proofId: "proof-1" },
        }),
        event("PROOF_VALIDATED", {
          localTimestamp: new Date("2026-10-20T10:05:00.000Z"),
          payload: { proofId: "proof-1" },
        }),
        event("LOCKED", {
          actorId: "agent-2",
          localTimestamp: new Date("2026-10-20T10:10:00.000Z"),
        }),
        event("SERVED", {
          actorId: "agent-2",
          localTimestamp: new Date("2026-10-20T10:15:00.000Z"),
        }),
      ],
      maintenant,
    );
    expect(derived.state).toBe("SERVED");
    expect(derived.proofId).toBe("proof-1");
    expect(derived.lockedBy).toBe("agent-2");
    expect(derived.lockExpired).toBe(false);
  });

  it("un refus garde la commande en attente et retient le motif", () => {
    const derived = deriveOrder(
      [
        creation,
        event("PROOF_SUBMITTED", {
          actorId: null,
          payload: { proofId: "proof-1" },
        }),
        event("PROOF_REFUSED", {
          payload: { proofId: "proof-1", reason: "Capture illisible" },
        }),
      ],
      new Date("2026-10-20T10:00:00.000Z"),
    );
    expect(derived.state).toBe("AWAITING_PROOF");
    expect(derived.refusalReason).toBe("Capture illisible");
  });

  it("un nouveau dépôt efface le motif de refus précédent", () => {
    const derived = deriveOrder(
      [
        creation,
        event("PROOF_REFUSED", {
          payload: { proofId: "proof-1", reason: "Capture illisible" },
        }),
        event("PROOF_SUBMITTED", {
          actorId: null,
          payload: { proofId: "proof-2" },
        }),
      ],
      new Date("2026-10-20T10:00:00.000Z"),
    );
    expect(derived.state).toBe("AWAITING_PROOF");
    expect(derived.refusalReason).toBeNull();
    expect(derived.proofId).toBe("proof-2");
  });

  it("le verrou expire et la commande redevient disponible", () => {
    const created = new Date("2026-10-20T10:00:00.000Z");
    const locked = new Date(created.getTime() + 1000);
    const comptoir = event("CREATED", {
      payload: { channel: "COUNTER", type: "PREPAID" },
    });
    const events = [comptoir, event("LOCKED", { localTimestamp: locked })];
    const avant = deriveOrder(events, new Date(locked.getTime() + LOCK_TTL_MS - 1));
    const apres = deriveOrder(events, new Date(locked.getTime() + LOCK_TTL_MS));
    expect(avant.state).toBe("LOCKED");
    expect(avant.lockExpired).toBe(false);
    expect(apres.state).toBe("QUEUED");
    expect(apres.lockExpired).toBe(true);
    expect(apres.lockedBy).toBe("agent-1");
  });

  it("refuse une transition impossible", () => {
    expect(() =>
      deriveOrder(
        [creation, event("SERVED")],
        new Date("2026-10-20T10:00:00.000Z"),
      ),
    ).toThrow(OrderError);
  });

  it("refuse une commande sans événement de création", () => {
    expect(() =>
      deriveOrder([event("LOCKED")], new Date("2026-10-20T10:00:00.000Z")),
    ).toThrow(OrderError);
  });

  it("une commande annulée ne reçoit plus rien", () => {
    const annulee = deriveOrder(
      [creation, event("CANCELLED")],
      new Date("2026-10-20T10:00:00.000Z"),
    );
    expect(annulee.state).toBe("CANCELLED");
    expect(nextState(annulee.state, "LOCKED")).toBeNull();
  });
});

describe("quantités et montants", () => {
  it("100 unités valent le prix d'un dollar", () => {
    expect(billedAmount(2350, 1000)).toBe(23500);
    expect(billedAmount(2350, 100)).toBe(2350);
    expect(unitsForBilledAmount(2350, 23500)).toBe(1000);
  });

  it("les deux saisies produisent la même commande quand le compte tombe juste", () => {
    const parUnites = resolveQuantity({ pricePerHundred: 2350, units: 1000 });
    const parMontant = resolveQuantity({ pricePerHundred: 2350, amount: 23500 });
    expect(parUnites).toEqual({ units: 1000, amount: 23500 });
    expect(parMontant).toEqual({ units: 1000, amount: 23500 });
  });

  it("un montant impair laisse un reste non facturé, jamais dépassé", () => {
    const quantite = resolveQuantity({ pricePerHundred: 2350, amount: 1000 });
    expect(quantite.units).toBe(42);
    expect(quantite.amount).toBe(987);
    expect(quantite.amount).toBeLessThanOrEqual(1000);
  });

  it("le montant facturé ne dépasse jamais le montant demandé", () => {
    for (let montant = 100; montant <= 5000; montant += 7) {
      const quantite = resolveQuantity({
        pricePerHundred: 2350,
        amount: montant,
      });
      expect(quantite.amount).toBeLessThanOrEqual(montant);
    }
  });

  it("un montant plus petit qu'une unité est refusé", () => {
    expect(() =>
      resolveQuantity({ pricePerHundred: 2350, amount: 23 }),
    ).toThrow(OrderError);
  });

  it("une quantité nulle ou fractionnaire est refusée", () => {
    expect(() =>
      resolveQuantity({ pricePerHundred: 2350, units: 0 }),
    ).toThrow(OrderError);
    expect(() =>
      resolveQuantity({ pricePerHundred: 2350, units: 1.5 }),
    ).toThrow(OrderError);
  });

  it("prépare une commande au réseau et au canal connus", () => {
    const prepared = prepareOrder(
      { network: "ORANGE", channel: "COUNTER", type: "PREPAID", units: "250" },
      2350,
    );
    expect(prepared).toEqual({
      network: "ORANGE",
      channel: "COUNTER",
      type: "PREPAID",
      units: 250,
      amount: 5875,
    });
  });

  it("refuse un réseau, un canal, un type inconnus et un prix absent", () => {
    const base = {
      network: "ORANGE",
      channel: "COUNTER",
      type: "PREPAID",
      units: 100,
    };
    expect(() => prepareOrder({ ...base, network: "MTN" }, 2350)).toThrow(
      OrderError,
    );
    expect(() => prepareOrder({ ...base, channel: "PHONE" }, 2350)).toThrow(
      OrderError,
    );
    expect(() => prepareOrder({ ...base, type: "LOAN" }, 2350)).toThrow(
      OrderError,
    );
    expect(() => prepareOrder(base, 0)).toThrow(OrderError);
  });
});
