import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { enregistrerEvenement } from "@/lib/authorizations/journal";
import { staffActorWith, type StaffActor } from "@/lib/authorizations/staff-actor";
import { insertRow } from "@/platform/writes";
import { receivables } from "@/modules/receivables/table";
import {
  deriveOrder,
  isTerminalState,
  nextState,
  OrderError,
  type DerivedOrder,
  type OrderEventKind,
} from "./order-record";
import { orderEvents, orders, type OrderRow } from "./table";

type Loaded = {
  order: OrderRow;
  derived: DerivedOrder;
};

async function loadForUpdate(
  ex: ExecuteurDb,
  orderId: string,
): Promise<Loaded> {
  const lignes = await ex
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
    .for("update");
  const order = lignes[0];
  if (!order) {
    throw new OrderError("ORDER_NOT_FOUND", "Commande introuvable.");
  }
  const evenements = await ex
    .select({
      kind: orderEvents.kind,
      actorId: orderEvents.actorId,
      payload: orderEvents.payload,
      localTimestamp: orderEvents.localTimestamp,
    })
    .from(orderEvents)
    .where(eq(orderEvents.orderId, orderId))
    .orderBy(asc(orderEvents.localTimestamp), asc(orderEvents.receivedAt));
  return {
    order,
    derived: deriveOrder(
      evenements.map((evenement) => ({
        kind: evenement.kind as OrderEventKind,
        actorId: evenement.actorId,
        payload: evenement.payload,
        localTimestamp: evenement.localTimestamp,
      })),
      new Date(),
    ),
  };
}

async function appendEvent(
  ex: ExecuteurDb,
  input: {
    order: OrderRow;
    derived: DerivedOrder;
    kind: OrderEventKind;
    actor: StaffActor;
    payload?: unknown;
    localTimestamp: Date;
    typeAction: string;
    extra?: Record<string, unknown>;
  },
): Promise<void> {
  const suivant = nextState(input.derived.state, input.kind);
  if (suivant === null) {
    throw new OrderError(
      "ILLEGAL_TRANSITION",
      `Transition impossible : ${input.derived.state} ne reçoit pas ${input.kind}.`,
    );
  }
  await insertRow(ex, orderEvents, {
    id: randomUUID(),
    orderId: input.order.id,
    kind: input.kind,
    actorId: input.actor.id,
    payload: input.payload ?? null,
    localTimestamp: input.localTimestamp,
    deviceId: input.order.deviceId,
  });
  const trace = await enregistrerEvenement(
    {
      acteurId: input.actor.id,
      roleAuMoment: input.actor.role,
      typeAction: input.typeAction,
      entite: "order",
      entiteId: input.order.id,
      avant: { state: input.derived.state },
      apres: { state: suivant, ...(input.extra ?? {}) },
      horodatageLocal: input.localTimestamp,
      appareilId: input.order.deviceId,
    },
    ex,
  );
  if (!trace.ok) {
    throw new OrderError(
      "AUDIT_UNAVAILABLE",
      "Journal indisponible : l'opération est annulée.",
    );
  }
}

export async function lockOrder(orderId: string): Promise<void> {
  const actor = await staffActorWith("commande.prendre");
  if (!actor) {
    throw new OrderError(
      "NOT_AUTHORIZED",
      "Prendre une commande exige la permission « commande.prendre ».",
    );
  }
  await db.transaction(async (tx) => {
    const { order, derived } = await loadForUpdate(tx, orderId);
    if (derived.state === "LOCKED" && derived.lockedBy === actor.id) return;
    if (derived.state === "LOCKED") {
      throw new OrderError(
        "LOCKED_BY_OTHER",
        "Cette commande est déjà prise par un autre agent.",
      );
    }
    if (derived.state !== "QUEUED") {
      throw new OrderError(
        "ILLEGAL_TRANSITION",
        "Seule une commande en file peut être prise.",
      );
    }
    await appendEvent(tx, {
      order,
      derived,
      kind: "LOCKED",
      actor,
      localTimestamp: new Date(),
      typeAction: "order.claim",
    });
  });
}

export async function serveOrder(orderId: string): Promise<void> {
  const actor = await staffActorWith("commande.servir");
  if (!actor) {
    throw new OrderError(
      "NOT_AUTHORIZED",
      "Servir une commande exige la permission « commande.servir ».",
    );
  }
  await db.transaction(async (tx) => {
    const { order, derived } = await loadForUpdate(tx, orderId);
    if (derived.state !== "LOCKED") {
      throw new OrderError(
        "ILLEGAL_TRANSITION",
        "Seule une commande prise peut être servie.",
      );
    }
    if (derived.lockedBy !== actor.id) {
      throw new OrderError(
        "LOCKED_BY_OTHER",
        "Cette commande est prise par un autre agent.",
      );
    }
    const instant = new Date();
    if (order.type === "CREDIT") {
      await insertRow(tx, receivables, {
        id: randomUUID(),
        profileId: order.profileId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        occurredAt: instant,
        enteredBy: actor.id,
        deviceId: order.deviceId,
      });
      const traceCreance = await enregistrerEvenement(
        {
          acteurId: actor.id,
          roleAuMoment: actor.role,
          typeAction: "receivable.create",
          entite: "receivable",
          entiteId: order.id,
          apres: {
            profileId: order.profileId,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
          },
          horodatageLocal: instant,
          appareilId: order.deviceId,
        },
        tx,
      );
      if (!traceCreance.ok) {
        throw new OrderError(
          "AUDIT_UNAVAILABLE",
          "Journal indisponible : la créance n'est pas créée.",
        );
      }
    }
    await appendEvent(tx, {
      order,
      derived,
      kind: "SERVED",
      actor,
      localTimestamp: instant,
      typeAction: "order.serve",
      extra: { credit: order.type === "CREDIT" },
    });
  });
}

export async function cancelOrder(
  orderId: string,
  reason?: string,
): Promise<void> {
  const actor = await staffActorWith("commande.annuler");
  if (!actor) {
    throw new OrderError(
      "NOT_AUTHORIZED",
      "Annuler une commande exige la permission « commande.annuler ».",
    );
  }
  const motif = String(reason ?? "").trim();
  await db.transaction(async (tx) => {
    const { order, derived } = await loadForUpdate(tx, orderId);
    if (isTerminalState(derived.state)) {
      throw new OrderError(
        "ILLEGAL_TRANSITION",
        "Une commande servie ou annulée ne change plus.",
      );
    }
    await appendEvent(tx, {
      order,
      derived,
      kind: "CANCELLED",
      actor,
      payload: motif === "" ? null : { reason: motif.slice(0, 500) },
      localTimestamp: new Date(),
      typeAction: "order.cancel",
      extra: motif === "" ? undefined : { reason: motif.slice(0, 500) },
    });
  });
}
