import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profilsClients } from "@/lib/db/schema/clients";
import { enregistrerEvenement } from "@/lib/authorizations/journal";
import { staffActorWith } from "@/lib/authorizations/staff-actor";
import { insertRow } from "@/platform/writes";
import { readPriceAt } from "@/modules/pricing/publish";
import { decideCredit } from "@/modules/receivables/credit";
import { readCreditPosition } from "./credit-position";
import {
  initialState,
  OrderError,
  prepareOrder,
  type Channel,
  type OrderState,
  type OrderType,
} from "./order-record";
import { orderEvents, orders } from "./table";

export type CreateOrderInput = {
  profileId: string;
  network: string;
  channel: string;
  type: string;
  units?: unknown;
  amount?: unknown;
  deviceId?: string | null;
  localTimestamp?: Date;
};

export type CreatedOrder = {
  id: string;
  profileId: string;
  network: string;
  channel: Channel;
  type: OrderType;
  units: number;
  amount: number;
  currency: string;
  pricePerHundred: number;
  state: OrderState;
  createdAt: Date;
};

function creditMessage(
  decision: ReturnType<typeof decideCredit>,
  currency: string,
): string {
  if (decision.ok) return "";
  if (decision.reason === "NO_LIMIT") {
    return `Aucun plafond de crédit en ${currency} pour ce client : la commande à crédit est refusée.`;
  }
  return `Plafond insuffisant : ${decision.available} ${currency} disponible(s), il manque ${decision.shortfall} ${currency}.`;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreatedOrder> {
  const actor = await staffActorWith("commande.creer");
  if (!actor) {
    throw new OrderError(
      "NOT_AUTHORIZED",
      "Créer une commande exige la permission « commande.creer ».",
    );
  }

  const instant = input.localTimestamp ?? new Date();
  const price = await readPriceAt(input.network, instant);
  if (!price) {
    throw new OrderError(
      "PRICE_MISSING",
      "Aucun prix en vigueur pour ce réseau : la grille tarifaire doit être renseignée.",
    );
  }

  const prepared = prepareOrder(
    {
      network: input.network,
      channel: input.channel,
      type: input.type,
      units: input.units,
      amount: input.amount,
    },
    price.amount,
  );

  const id = randomUUID();

  await db.transaction(async (tx) => {
    const profils = await tx
      .select({
        id: profilsClients.id,
        limitAmount: profilsClients.plafondMontant,
        limitCurrency: profilsClients.plafondDevise,
      })
      .from(profilsClients)
      .where(eq(profilsClients.id, input.profileId))
      .limit(1)
      .for("update");
    if (!profils[0]) {
      throw new OrderError("PROFILE_NOT_FOUND", "Profil client introuvable.");
    }

    if (prepared.type === "CREDIT") {
      const position = await readCreditPosition(
        tx,
        input.profileId,
        price.currency,
      );
      const decision = decideCredit({
        type: prepared.type,
        amount: prepared.amount,
        position,
      });
      if (!decision.ok) {
        throw new OrderError(
          "CREDIT_EXCEEDED",
          creditMessage(decision, price.currency),
        );
      }
    }

    await insertRow(tx, orders, {
      id,
      profileId: input.profileId,
      network: prepared.network,
      channel: prepared.channel,
      type: prepared.type,
      units: prepared.units,
      pricePerHundred: price.amount,
      amount: prepared.amount,
      currency: price.currency,
      createdBy: actor.id,
      localTimestamp: instant,
      deviceId: input.deviceId ?? null,
    });

    await insertRow(tx, orderEvents, {
      id: randomUUID(),
      orderId: id,
      kind: "CREATED",
      actorId: actor.id,
      payload: {
        channel: prepared.channel,
        type: prepared.type,
        priceId: price.id,
        priceCurrency: price.currency,
        priceEffectiveAt: price.effectiveAt.toISOString(),
      },
      localTimestamp: instant,
      deviceId: input.deviceId ?? null,
    });

    const trace = await enregistrerEvenement(
      {
        acteurId: actor.id,
        roleAuMoment: actor.role,
        typeAction: "order.create",
        entite: "order",
        entiteId: id,
        apres: {
          profileId: input.profileId,
          network: prepared.network,
          channel: prepared.channel,
          type: prepared.type,
          units: prepared.units,
          amount: prepared.amount,
          currency: price.currency,
          pricePerHundred: price.amount,
        },
        horodatageLocal: instant,
        appareilId: input.deviceId ?? null,
      },
      tx,
    );
    if (!trace.ok) {
      throw new OrderError(
        "AUDIT_UNAVAILABLE",
        "Journal indisponible : la commande n'est pas créée.",
      );
    }
  });

  return {
    id,
    profileId: input.profileId,
    network: prepared.network,
    channel: prepared.channel,
    type: prepared.type,
    units: prepared.units,
    amount: prepared.amount,
    currency: price.currency,
    pricePerHundred: price.amount,
    state: initialState(prepared.channel, prepared.type),
    createdAt: instant,
  };
}
