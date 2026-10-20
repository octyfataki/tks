import { and, eq, inArray, notExists, sql } from "drizzle-orm";
import type { ExecuteurDb } from "@/lib/db/client";
import { profilsClients } from "@/lib/db/schema/clients";
import { receivables } from "@/modules/receivables/table";
import { creditLimitFor, type CreditPosition } from "@/modules/receivables/credit";
import { orderEvents, orders } from "./table";

const TERMINAL_KINDS = ["SERVED", "CANCELLED"];

async function sumReceivables(
  ex: ExecuteurDb,
  profileId: string,
  currency: string,
): Promise<number> {
  const lignes = await ex
    .select({ total: sql<string>`coalesce(sum(${receivables.amount}), 0)` })
    .from(receivables)
    .where(
      and(
        eq(receivables.profileId, profileId),
        eq(receivables.currency, currency),
      ),
    );
  return Number(lignes[0]?.total ?? 0);
}

async function sumEngaged(
  ex: ExecuteurDb,
  profileId: string,
  currency: string,
): Promise<number> {
  const clos = ex
    .select({ present: sql`1` })
    .from(orderEvents)
    .where(
      and(
        eq(orderEvents.orderId, orders.id),
        inArray(orderEvents.kind, TERMINAL_KINDS),
      ),
    );
  const lignes = await ex
    .select({ total: sql<string>`coalesce(sum(${orders.amount}), 0)` })
    .from(orders)
    .where(
      and(
        eq(orders.profileId, profileId),
        eq(orders.type, "CREDIT"),
        eq(orders.currency, currency),
        notExists(clos),
      ),
    );
  return Number(lignes[0]?.total ?? 0);
}

export async function readCreditPosition(
  ex: ExecuteurDb,
  profileId: string,
  currency: string,
): Promise<CreditPosition> {
  const profile = await ex
    .select({
      limitAmount: profilsClients.plafondMontant,
      limitCurrency: profilsClients.plafondDevise,
    })
    .from(profilsClients)
    .where(eq(profilsClients.id, profileId))
    .limit(1);
  const ligne = profile[0];
  const limit = ligne
    ? creditLimitFor(
        {
          plafondMontant: Number(ligne.limitAmount),
          plafondDevise: String(ligne.limitCurrency),
        },
        currency,
      )
    : 0;
  const encours = await sumReceivables(ex, profileId, currency);
  const engage = await sumEngaged(ex, profileId, currency);
  return { limit, receivables: encours, engaged: engage };
}
