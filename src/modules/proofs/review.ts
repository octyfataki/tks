import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { enregistrerEvenement } from "@/lib/authorizations/journal";
import { staffActorWith } from "@/lib/authorizations/staff-actor";
import {
  enregistrer,
  FichierError,
  lire,
  supprimer,
} from "@/platform/files";
import { insertRow, updateRow } from "@/platform/writes";
import {
  deriveOrder,
  OrderError,
  type OrderEventKind,
} from "@/modules/orders/order-record";
import { orderEvents, orders } from "@/modules/orders/table";
import { prepareRefusal, prepareValidation } from "./proof-record";
import { paymentProofs, type PaymentProofRow } from "./table";

export type SubmitProofInput = {
  orderId: string;
  file: { name: string; mime: string; bytes: Uint8Array };
  submittedBy: string | null;
  deviceId?: string | null;
  localTimestamp?: Date;
};

async function orderState(
  ex: ExecuteurDb,
  orderId: string,
): Promise<{ type: string; units: number; amount: number; currency: string; state: string }> {
  const lignes = await ex
    .select({
      type: orders.type,
      units: orders.units,
      amount: orders.amount,
      currency: orders.currency,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
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
  const derived = deriveOrder(
    evenements.map((evenement) => ({
      kind: evenement.kind as OrderEventKind,
      actorId: evenement.actorId,
      payload: evenement.payload,
      localTimestamp: evenement.localTimestamp,
    })),
    new Date(),
  );
  return { ...order, state: derived.state };
}

async function appendProofEvent(
  ex: ExecuteurDb,
  input: {
    orderId: string;
    kind: OrderEventKind;
    actorId: string | null;
    payload: unknown;
    localTimestamp: Date;
    deviceId: string | null;
  },
): Promise<void> {
  await insertRow(ex, orderEvents, {
    id: randomUUID(),
    orderId: input.orderId,
    kind: input.kind,
    actorId: input.actorId,
    payload: input.payload,
    localTimestamp: input.localTimestamp,
    deviceId: input.deviceId,
  });
}

export async function submitProof(
  input: SubmitProofInput,
): Promise<{ proofId: string }> {
  const instant = input.localTimestamp ?? new Date();
  const etat = await orderState(db, input.orderId);
  if (etat.state !== "AWAITING_PROOF") {
    throw new OrderError(
      "ILLEGAL_TRANSITION",
      "Cette commande n'attend pas de preuve de paiement.",
    );
  }

  let depose;
  try {
    depose = await enregistrer("preuve_paiement", {
      nom: input.file.name,
      mime: input.file.mime,
      octets: input.file.bytes,
    });
  } catch (erreur) {
    if (erreur instanceof FichierError) {
      throw new OrderError("PROOF_INVALID", erreur.message);
    }
    throw erreur;
  }

  const proofId = randomUUID();
  try {
    await db.transaction(async (tx) => {
      await insertRow(tx, paymentProofs, {
        id: proofId,
        orderId: input.orderId,
        fileKey: depose.cle,
        mime: depose.mime,
        sizeBytes: depose.tailleOctets,
        status: "PENDING",
        submittedBy: input.submittedBy,
        localTimestamp: instant,
        deviceId: input.deviceId ?? null,
      });
      await appendProofEvent(tx, {
        orderId: input.orderId,
        kind: "PROOF_SUBMITTED",
        actorId: input.submittedBy,
        payload: { proofId },
        localTimestamp: instant,
        deviceId: input.deviceId ?? null,
      });
      const trace = await enregistrerEvenement(
        {
          acteurId: input.submittedBy,
          roleAuMoment: input.submittedBy ? "CLIENT" : "SYSTEME",
          typeAction: "payment_proof.submit",
          entite: "payment_proof",
          entiteId: proofId,
          apres: { orderId: input.orderId, mime: depose.mime },
          horodatageLocal: instant,
          appareilId: input.deviceId ?? null,
        },
        tx,
      );
      if (!trace.ok) {
        throw new OrderError(
          "AUDIT_UNAVAILABLE",
          "Journal indisponible : la preuve n'est pas enregistrée.",
        );
      }
    });
  } catch (erreur) {
    await supprimer(depose.cle).catch(() => undefined);
    throw erreur;
  }
  return { proofId };
}

async function loadProofForUpdate(
  ex: ExecuteurDb,
  proofId: string,
): Promise<PaymentProofRow> {
  const lignes = await ex
    .select()
    .from(paymentProofs)
    .where(eq(paymentProofs.id, proofId))
    .limit(1)
    .for("update");
  const proof = lignes[0];
  if (!proof) {
    throw new OrderError("PROOF_MISSING", "Preuve introuvable.");
  }
  return proof;
}

async function decideProof(input: {
  proofId: string;
  status: "VALIDATED" | "REFUSED";
  reason?: string;
  typeAction: string;
}): Promise<void> {
  const actor = await staffActorWith("preuve.valider");
  if (!actor) {
    throw new OrderError(
      "NOT_AUTHORIZED",
      "Trancher une preuve exige la permission « preuve.valider ».",
    );
  }
  const motif =
    input.status === "REFUSED" ? prepareRefusal(input.reason) : null;
  await db.transaction(async (tx) => {
    const proof = await loadProofForUpdate(tx, input.proofId);
    prepareValidation(proof.status);
    const etat = await orderState(tx, proof.orderId);
    if (etat.state !== "AWAITING_PROOF") {
      throw new OrderError(
        "ILLEGAL_TRANSITION",
        "Cette commande n'attend plus de preuve : la preuve ne peut plus être tranchée.",
      );
    }
    const instant = new Date();
    const pendingFilter = and(
      eq(paymentProofs.id, input.proofId),
      eq(paymentProofs.status, "PENDING"),
    );
    if (!pendingFilter) {
      throw new OrderError("STALE_STATE", "Preuve déjà tranchée.");
    }
    await updateRow(
      tx,
      paymentProofs,
      {
        status: input.status,
        refusalReason: motif,
        reviewedBy: actor.id,
        reviewedAt: instant,
      },
      pendingFilter,
    );
    await appendProofEvent(tx, {
      orderId: proof.orderId,
      kind: input.status === "VALIDATED" ? "PROOF_VALIDATED" : "PROOF_REFUSED",
      actorId: actor.id,
      payload: {
        proofId: input.proofId,
        ...(motif ? { reason: motif } : {}),
      },
      localTimestamp: instant,
      deviceId: proof.deviceId,
    });
    const trace = await enregistrerEvenement(
      {
        acteurId: actor.id,
        roleAuMoment: actor.role,
        typeAction: input.typeAction,
        entite: "payment_proof",
        entiteId: input.proofId,
        avant: { status: proof.status },
        apres: {
          status: input.status,
          orderId: proof.orderId,
          ...(motif ? { reason: motif } : {}),
        },
        horodatageLocal: instant,
        appareilId: proof.deviceId,
      },
      tx,
    );
    if (!trace.ok) {
      throw new OrderError(
        "AUDIT_UNAVAILABLE",
        "Journal indisponible : la décision n'est pas enregistrée.",
      );
    }
  });
}

export async function validateProof(proofId: string): Promise<void> {
  await decideProof({
    proofId,
    status: "VALIDATED",
    typeAction: "payment_proof.validate",
  });
}

export async function refuseProof(
  proofId: string,
  reason: string,
): Promise<void> {
  await decideProof({
    proofId,
    status: "REFUSED",
    reason,
    typeAction: "payment_proof.refuse",
  });
}

export async function readProofFile(
  proofId: string,
): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const lignes = await db
    .select({ fileKey: paymentProofs.fileKey })
    .from(paymentProofs)
    .where(eq(paymentProofs.id, proofId))
    .limit(1);
  const proof = lignes[0];
  if (!proof) return null;
  try {
    const fichier = await lire(proof.fileKey);
    return { bytes: fichier.octets, mime: fichier.mime };
  } catch (erreur) {
    if (erreur instanceof FichierError) return null;
    throw erreur;
  }
}
