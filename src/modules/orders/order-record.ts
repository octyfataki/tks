import {
  amountForUnits,
  isNetwork,
  unitsForAmount,
  type Network,
} from "@/modules/pricing/price-record";

export const CHANNELS = ["ONLINE", "COUNTER"] as const;
export type Channel = (typeof CHANNELS)[number];

export const ORDER_TYPES = ["PREPAID", "CREDIT"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATES = [
  "AWAITING_PROOF",
  "QUEUED",
  "LOCKED",
  "SERVED",
  "CANCELLED",
] as const;
export type OrderState = (typeof ORDER_STATES)[number];

export const ORDER_EVENT_KINDS = [
  "CREATED",
  "PROOF_SUBMITTED",
  "PROOF_VALIDATED",
  "PROOF_REFUSED",
  "LOCKED",
  "SERVED",
  "CANCELLED",
] as const;
export type OrderEventKind = (typeof ORDER_EVENT_KINDS)[number];

export const TERMINAL_ORDER_STATES: readonly OrderState[] = [
  "SERVED",
  "CANCELLED",
];

export const LOCK_TTL_MS = 15 * 60 * 1000;

export const UNITS_MIN = 1;
export const UNITS_MAX = 4_294_967_295;
export const AMOUNT_MAX = 4_294_967_295;

export type OrderErrorCode =
  | "NETWORK_UNKNOWN"
  | "CHANNEL_UNKNOWN"
  | "TYPE_UNKNOWN"
  | "UNITS_INVALID"
  | "AMOUNT_INVALID"
  | "AMOUNT_TOO_SMALL"
  | "AMOUNT_OVERFLOW"
  | "PRICE_MISSING"
  | "STATE_INVALID"
  | "ILLEGAL_TRANSITION"
  | "CREDIT_EXCEEDED"
  | "LOCKED_BY_OTHER"
  | "ORDER_NOT_FOUND"
  | "PROFILE_NOT_FOUND"
  | "STALE_STATE"
  | "PROOF_MISSING"
  | "PROOF_INVALID"
  | "REASON_REQUIRED"
  | "NOT_AUTHORIZED"
  | "AUDIT_UNAVAILABLE";

export class OrderError extends Error {
  code: OrderErrorCode;
  constructor(code: OrderErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type OrderEventRecord = {
  kind: OrderEventKind;
  actorId: string | null;
  localTimestamp: Date;
  payload?: unknown;
};

export type DerivedOrder = {
  state: OrderState;
  lockedBy: string | null;
  lockedAt: Date | null;
  lockExpired: boolean;
  proofId: string | null;
  refusalReason: string | null;
};

export type OrderQuantity = {
  units: number;
  amount: number;
};

export function isChannel(value: string): value is Channel {
  return (CHANNELS as readonly string[]).includes(value);
}

export function isOrderType(value: string): value is OrderType {
  return (ORDER_TYPES as readonly string[]).includes(value);
}

export function isOrderState(value: string): value is OrderState {
  return (ORDER_STATES as readonly string[]).includes(value);
}

export function isTerminalState(state: OrderState): boolean {
  return TERMINAL_ORDER_STATES.includes(state);
}

export function initialState(channel: Channel, type: OrderType): OrderState {
  if (channel === "COUNTER") return "QUEUED";
  if (type === "PREPAID") return "AWAITING_PROOF";
  return "QUEUED";
}

export function nextState(
  state: OrderState,
  kind: OrderEventKind,
): OrderState | null {
  if (isTerminalState(state)) return null;
  if (kind === "CANCELLED") return "CANCELLED";
  if (state === "AWAITING_PROOF") {
    if (kind === "PROOF_SUBMITTED") return "AWAITING_PROOF";
    if (kind === "PROOF_REFUSED") return "AWAITING_PROOF";
    if (kind === "PROOF_VALIDATED") return "QUEUED";
    return null;
  }
  if (state === "QUEUED") {
    if (kind === "LOCKED") return "LOCKED";
    return null;
  }
  if (state === "LOCKED") {
    if (kind === "SERVED") return "SERVED";
    return null;
  }
  return null;
}

export function billedAmount(pricePerHundred: number, units: number): number {
  return Math.round(amountForUnits(pricePerHundred, units));
}

function billedAmountGuard(pricePerHundred: number, units: number): number {
  const montant = billedAmount(pricePerHundred, units);
  if (montant > AMOUNT_MAX) {
    throw new OrderError(
      "AMOUNT_OVERFLOW",
      "Quantité trop grande : le montant facturé dépasse la limite.",
    );
  }
  return montant;
}

export function unitsForBilledAmount(
  pricePerHundred: number,
  amount: number,
): number {
  return Math.floor(unitsForAmount(pricePerHundred, amount));
}

export function resolveQuantity(input: {
  pricePerHundred: number;
  units?: unknown;
  amount?: unknown;
}): OrderQuantity {
  if (input.units !== undefined && input.units !== null && input.units !== "") {
    const units = Number(input.units);
    if (
      !Number.isInteger(units) ||
      units < UNITS_MIN ||
      units > UNITS_MAX
    ) {
      throw new OrderError(
        "UNITS_INVALID",
        "Quantité invalide : un nombre entier d'unités, au moins 1.",
      );
    }
    return {
      units,
      amount: billedAmountGuard(input.pricePerHundred, units),
    };
  }
  const amount = Number(input.amount);
  if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > AMOUNT_MAX
  ) {
    throw new OrderError(
      "AMOUNT_INVALID",
      "Montant invalide : un nombre entier, strictement positif, dans la devise du prix.",
    );
  }
  const units = unitsForBilledAmount(input.pricePerHundred, amount);
  if (units < UNITS_MIN) {
    throw new OrderError(
      "AMOUNT_TOO_SMALL",
      "Montant trop petit pour une unité au prix en vigueur.",
    );
  }
  return {
    units,
    amount: billedAmountGuard(input.pricePerHundred, units),
  };
}

export type OrderDraft = {
  network: string;
  channel: string;
  type: string;
  units?: unknown;
  amount?: unknown;
};

export type PreparedOrder = {
  network: Network;
  channel: Channel;
  type: OrderType;
  units: number;
  amount: number;
};

export function prepareOrder(
  draft: OrderDraft,
  pricePerHundred: number,
): PreparedOrder {
  if (!isNetwork(draft.network)) {
    throw new OrderError("NETWORK_UNKNOWN", "Réseau inconnu.");
  }
  if (!isChannel(draft.channel)) {
    throw new OrderError("CHANNEL_UNKNOWN", "Canal inconnu.");
  }
  if (!isOrderType(draft.type)) {
    throw new OrderError("TYPE_UNKNOWN", "Type de commande inconnu.");
  }
  if (!Number.isInteger(pricePerHundred) || pricePerHundred <= 0) {
    throw new OrderError(
      "PRICE_MISSING",
      "Aucun prix en vigueur pour ce réseau : la commande ne peut pas être chiffrée.",
    );
  }
  const quantity = resolveQuantity({
    pricePerHundred,
    units: draft.units,
    amount: draft.amount,
  });
  return {
    network: draft.network,
    channel: draft.channel,
    type: draft.type,
    units: quantity.units,
    amount: quantity.amount,
  };
}

function readCreated(payload: unknown): {
  channel: Channel;
  type: OrderType;
} {
  const valeur = payload as { channel?: unknown; type?: unknown } | null;
  if (
    !valeur ||
    typeof valeur.channel !== "string" ||
    typeof valeur.type !== "string" ||
    !isChannel(valeur.channel) ||
    !isOrderType(valeur.type)
  ) {
    throw new OrderError(
      "STATE_INVALID",
      "Événement de création illisible : ni canal ni type exploitables.",
    );
  }
  return { channel: valeur.channel, type: valeur.type };
}

function readRefusal(payload: unknown): string | null {
  const valeur = payload as { reason?: unknown } | null;
  if (!valeur || typeof valeur.reason !== "string") return null;
  const motif = valeur.reason.trim();
  return motif === "" ? null : motif;
}

function readProof(payload: unknown): string | null {
  const valeur = payload as { proofId?: unknown } | null;
  if (!valeur || typeof valeur.proofId !== "string") return null;
  return valeur.proofId;
}

export function deriveOrder(
  events: readonly OrderEventRecord[],
  now: Date,
): DerivedOrder {
  const creation = events.find((event) => event.kind === "CREATED");
  if (!creation) {
    throw new OrderError(
      "STATE_INVALID",
      "Commande sans événement de création.",
    );
  }
  const { channel, type } = readCreated(creation.payload);
  let state = initialState(channel, type);
  let lockedBy: string | null = null;
  let lockedAt: Date | null = null;
  let proofId: string | null = null;
  let refusalReason: string | null = null;

  for (const event of events) {
    if (event.kind === "CREATED") continue;
    const suivant = nextState(state, event.kind);
    if (suivant === null) {
      throw new OrderError(
        "ILLEGAL_TRANSITION",
        `Transition impossible : ${state} ne reçoit pas ${event.kind}.`,
      );
    }
    state = suivant;
    if (event.kind === "LOCKED") {
      lockedBy = event.actorId;
      lockedAt = event.localTimestamp;
    }
    if (event.kind === "PROOF_SUBMITTED") {
      proofId = readProof(event.payload);
      refusalReason = null;
    }
    if (event.kind === "PROOF_REFUSED") {
      refusalReason = readRefusal(event.payload);
    }
    if (event.kind === "PROOF_VALIDATED") {
      refusalReason = null;
    }
  }

  let lockExpired = false;
  if (state === "LOCKED" && lockedAt !== null) {
    if (now.getTime() - lockedAt.getTime() >= LOCK_TTL_MS) {
      state = "QUEUED";
      lockExpired = true;
    }
  }

  return { state, lockedBy, lockedAt, lockExpired, proofId, refusalReason };
}

export function isLockHolder(
  derived: DerivedOrder,
  actorId: string,
): boolean {
  return derived.state === "LOCKED" && derived.lockedBy === actorId;
}
