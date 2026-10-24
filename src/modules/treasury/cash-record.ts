import {
  CLOSED_NETWORKS,
  CURRENCIES,
  NETWORK_LABELS,
  type Currency,
  type Network,
  readAmount,
} from "@/modules/pricing/price-record";

export const AMOUNT_MAX = 4_294_967_295;
export const DESCRIPTION_MAX = 400;

export const ACCOUNT_TYPES = ["CASH", "ELECTRONIC_MONEY"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Caisse",
  ELECTRONIC_MONEY: "Monnaie électronique",
};

export const MOVEMENT_DIRECTIONS = ["IN", "OUT"] as const;

export type MovementDirection = (typeof MOVEMENT_DIRECTIONS)[number];

export const DIRECTION_LABELS: Record<MovementDirection, string> = {
  IN: "Entrée",
  OUT: "Sortie",
};

export const CATEGORIES = [
  "SALE",
  "BANK_WITHDRAWAL",
  "OPERATOR_TOPUP",
  "REPAYMENT",
  "TRANSFER",
  "OWNER_WITHDRAWAL",
] as const;

export type CashCategory = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CashCategory, string> = {
  SALE: "Vente",
  BANK_WITHDRAWAL: "Retrait banque",
  OPERATOR_TOPUP: "Recharge opérateur",
  REPAYMENT: "Remboursement",
  TRANSFER: "Transfert",
  OWNER_WITHDRAWAL: "Retrait propriétaire",
};

export const CATEGORY_DIRECTIONS: Record<
  CashCategory,
  readonly MovementDirection[]
> = {
  SALE: ["IN"],
  BANK_WITHDRAWAL: ["OUT"],
  OPERATOR_TOPUP: ["OUT"],
  REPAYMENT: ["OUT"],
  TRANSFER: ["IN", "OUT"],
  OWNER_WITHDRAWAL: ["OUT"],
};

export const MOVEMENT_KINDS = ["OPERATION", "CORRECTION"] as const;
export type MovementKind = (typeof MOVEMENT_KINDS)[number];

export const SOURCE_KINDS = ["MANUAL", "AUTOMATIC"] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

export type CashErrorCode =
  | "ACCOUNT_TYPE_UNKNOWN"
  | "NETWORK_UNKNOWN"
  | "CURRENCY_UNKNOWN"
  | "AMOUNT_INVALID"
  | "OPENING_INVALID"
  | "CATEGORY_REQUIRED"
  | "CATEGORY_DIRECTION_INVALID"
  | "TRANSFER_NOT_MANUAL"
  | "ACCOUNT_REQUIRED"
  | "ACCOUNT_UNKNOWN"
  | "CURRENCY_MISMATCH"
  | "TRANSFER_SAME_ACCOUNT"
  | "ACCOUNT_EXISTS"
  | "MOTIF_REQUIRED"
  | "CORRECTION_IMPOSSIBLE"
  | "ALREADY_CORRECTED"
  | "NOT_ALLOWED"
  | "AUDIT_UNAVAILABLE"
  | "IMPOSSIBLE";

export class CashError extends Error {
  code: CashErrorCode;
  constructor(code: CashErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type CashAccountRow = {
  id: string;
  type: string;
  network: string;
  currency: string;
  openingAmount: number;
  openedAt: Date;
};

export type MovementView = {
  id: string;
  accountId: string;
  kind: string;
  direction: string;
  category: string;
  amount: number;
  currency: string;
  description: string | null;
  occurredAt: Date;
  sourceKind: string;
  sourceId: string | null;
  transferId: string | null;
  correctedOf: string | null;
};

export type MovementDraft = {
  accountId: unknown;
  direction: unknown;
  category: unknown;
  amount: unknown;
  currency: unknown;
  description?: string | null;
  occurredAt?: Date;
  deviceId?: string | null;
};

export type PreparedMovement = {
  accountId: string;
  direction: MovementDirection;
  category: CashCategory;
  amount: number;
  currency: Currency;
  description: string | null;
  occurredAt: Date;
  deviceId: string | null;
};

export type TransferDraft = {
  fromAccountId: unknown;
  toAccountId: unknown;
  amount: unknown;
  currency: unknown;
  description?: string | null;
  occurredAt?: Date;
  deviceId?: string | null;
};

export type PreparedTransfer = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: Currency;
  description: string | null;
  occurredAt: Date;
  deviceId: string | null;
};

export type AccountDraft = {
  type: unknown;
  network: unknown;
  currency: unknown;
  openingAmount: unknown;
  openedAt?: Date;
  deviceId?: string | null;
};

export type PreparedAccount = {
  type: AccountType;
  network: string;
  currency: Currency;
  openingAmount: number;
  openedAt: Date;
  deviceId: string | null;
};

export function estTypeCompte(value: string): value is AccountType {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

export function estDirection(value: string): value is MovementDirection {
  return (MOVEMENT_DIRECTIONS as readonly string[]).includes(value);
}

export function estCategorie(value: string): value is CashCategory {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function estDevise(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function estReseau(value: string): value is Network {
  return (CLOSED_NETWORKS as readonly string[]).includes(value);
}

export function reseauLabel(network: string): string {
  return estReseau(network) ? NETWORK_LABELS[network] : network;
}

export function montantValide(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= AMOUNT_MAX
  );
}

function lireDescription(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const texte = value.trim();
  if (texte === "") return null;
  return texte.slice(0, DESCRIPTION_MAX);
}

function ouvertureValide(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= AMOUNT_MAX
  );
}

export function compteLabel(account: { type: string; network: string }): string {
  if (!estTypeCompte(account.type)) return account.network;
  if (account.type === "CASH") return "Caisse";
  return reseauLabel(account.network);
}

export function prepareAccount(draft: AccountDraft): PreparedAccount {
  if (typeof draft.type !== "string" || !estTypeCompte(draft.type)) {
    throw new CashError("ACCOUNT_TYPE_UNKNOWN", "Type de compte inconnu.");
  }
  if (typeof draft.currency !== "string" || !estDevise(draft.currency)) {
    throw new CashError("CURRENCY_UNKNOWN", "Devise inconnue : USD ou CDF.");
  }
  let network: string;
  if (draft.type === "ELECTRONIC_MONEY") {
    if (typeof draft.network !== "string" || !estReseau(draft.network)) {
      throw new CashError(
        "NETWORK_UNKNOWN",
        "Réseau inconnu : Orange, Airtel, Africell ou Vodacom.",
      );
    }
    network = draft.network;
  } else {
    if (typeof draft.network === "string" && draft.network !== "") {
      throw new CashError("NETWORK_UNKNOWN", "La caisse ne porte pas de réseau.");
    }
    network = "";
  }
  if (!ouvertureValide(draft.openingAmount)) {
    throw new CashError(
      "OPENING_INVALID",
      "Un solde d'ouverture est exigé : un entier, zéro admis, dans la devise du compte.",
    );
  }
  return {
    type: draft.type,
    network,
    currency: draft.currency,
    openingAmount: draft.openingAmount,
    openedAt: draft.openedAt ?? new Date(),
    deviceId: draft.deviceId ?? null,
  };
}

export function prepareMovement(
  draft: MovementDraft,
  compte: { currency: string },
): PreparedMovement {
  if (typeof draft.accountId !== "string" || draft.accountId === "") {
    throw new CashError("ACCOUNT_REQUIRED", "Le compte est obligatoire.");
  }
  if (
    typeof draft.direction !== "string" ||
    !estDirection(draft.direction) ||
    typeof draft.category !== "string" ||
    !estCategorie(draft.category)
  ) {
    throw new CashError(
      "CATEGORY_REQUIRED",
      "Un sens et une catégorie sont obligatoires : chaque argent porte son motif.",
    );
  }
  const categorie = draft.category;
  const direction = draft.direction;
  if (categorie === "TRANSFER") {
    throw new CashError(
      "TRANSFER_NOT_MANUAL",
      "Un transfert passe par l'opération de transfert, jamais par un mouvement saisi.",
    );
  }
  if (!CATEGORY_DIRECTIONS[categorie].includes(direction)) {
    throw new CashError(
      "CATEGORY_DIRECTION_INVALID",
      `La catégorie ${CATEGORY_LABELS[categorie]} ne produit pas de ${DIRECTION_LABELS[direction].toLowerCase()}.`,
    );
  }
  if (typeof draft.currency !== "string" || !estDevise(draft.currency)) {
    throw new CashError("CURRENCY_UNKNOWN", "Devise inconnue : USD ou CDF.");
  }
  if (!estDevise(compte.currency)) {
    throw new CashError("ACCOUNT_UNKNOWN", "Compte introuvable.");
  }
  if (draft.currency !== compte.currency) {
    throw new CashError(
      "CURRENCY_MISMATCH",
      `Le compte est tenu en ${compte.currency} : un mouvement en ${draft.currency} y est refusé.`,
    );
  }
  const montant = readAmount(draft.amount);
  if (!montantValide(montant)) {
    throw new CashError(
      "AMOUNT_INVALID",
      "Montant invalide : un entier strictement positif, dans la devise du compte.",
    );
  }
  return {
    accountId: draft.accountId,
    direction,
    category: categorie,
    amount: montant,
    currency: draft.currency,
    description: lireDescription(draft.description ?? null),
    occurredAt: draft.occurredAt ?? new Date(),
    deviceId: draft.deviceId ?? null,
  };
}

export function prepareTransfer(draft: TransferDraft): PreparedTransfer {
  if (
    typeof draft.fromAccountId !== "string" ||
    typeof draft.toAccountId !== "string" ||
    draft.fromAccountId === "" ||
    draft.toAccountId === ""
  ) {
    throw new CashError(
      "ACCOUNT_REQUIRED",
      "Un transfert désigne un compte de départ et un compte d'arrivée.",
    );
  }
  if (draft.fromAccountId === draft.toAccountId) {
    throw new CashError(
      "TRANSFER_SAME_ACCOUNT",
      "Un transfert relie deux comptes différents.",
    );
  }
  if (typeof draft.currency !== "string" || !estDevise(draft.currency)) {
    throw new CashError("CURRENCY_UNKNOWN", "Devise inconnue : USD ou CDF.");
  }
  const montant = readAmount(draft.amount);
  if (!montantValide(montant)) {
    throw new CashError(
      "AMOUNT_INVALID",
      "Montant invalide : un entier strictement positif.",
    );
  }
  return {
    fromAccountId: draft.fromAccountId,
    toAccountId: draft.toAccountId,
    amount: montant,
    currency: draft.currency,
    description: lireDescription(draft.description ?? null),
    occurredAt: draft.occurredAt ?? new Date(),
    deviceId: draft.deviceId ?? null,
  };
}

export function sensCorrection(direction: string): MovementDirection {
  if (!estDirection(direction)) {
    throw new CashError("CORRECTION_IMPOSSIBLE", "Mouvement illisible.");
  }
  return direction === "IN" ? "OUT" : "IN";
}

export function montantSigne(mouvement: {
  direction: string;
  amount: number;
}): number {
  if (!estDirection(mouvement.direction)) return -mouvement.amount;
  return mouvement.direction === "IN" ? mouvement.amount : -mouvement.amount;
}

export function soldeOf(
  ouverture: { openingAmount: number; openedAt: Date },
  mouvements: readonly { direction: string; amount: number; occurredAt: Date }[],
  instant?: Date,
): number {
  const borne = instant?.getTime() ?? Number.POSITIVE_INFINITY;
  if (ouverture.openedAt.getTime() > borne) return 0;
  const total =
    ouverture.openingAmount +
    mouvements
      .filter((mouvement) => mouvement.occurredAt.getTime() <= borne)
      .reduce((total, mouvement) => total + montantSigne(mouvement), 0);
  return total;
}

export type FluxTotaux = {
  entrees: number;
  sorties: number;
  parCategorie: Map<CashCategory, { entrees: number; sorties: number }>;
};

export function calculeFluxTotaux(
  mouvements: readonly { direction: string; category: string; amount: number }[],
): FluxTotaux {
  const parCategorie = new Map<
    CashCategory,
    { entrees: number; sorties: number }
  >();
  let entrees = 0;
  let sorties = 0;
  for (const mouvement of mouvements) {
    if (!estCategorie(mouvement.category)) continue;
    if (mouvement.category === "TRANSFER") continue;
    const signe = montantSigne(mouvement);
    const panier = parCategorie.get(mouvement.category) ?? {
      entrees: 0,
      sorties: 0,
    };
    if (signe >= 0) {
      entrees += signe;
      panier.entrees += signe;
    } else {
      sorties += -signe;
      panier.sorties += -signe;
    }
    parCategorie.set(mouvement.category, panier);
  }
  return { entrees, sorties, parCategorie };
}
