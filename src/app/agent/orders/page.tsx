import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardListIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { OrderQueue } from "@/components/orders/order-queue";
import { aPermission } from "@/lib/authorizations/permissions";
import {
  currentStaffAccount,
  staffActorWithAny,
} from "@/lib/authorizations/staff-actor";
import { readQueue } from "@/modules/orders/read";

export const metadata: Metadata = {
  title: "Commandes — Agent — TKS",
  description:
    "File d'attente et caisse rapide : servir les commandes des clients.",
};

const MESSAGES: Record<string, string> = {
  "order-taken": "Commande prise. Elle est à vous jusqu'à ce que vous la serviez.",
  "order-served": "Commande servie.",
  "order-cancelled": "Commande annulée.",
};

export default async function AgentOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const acteur = await staffActorWithAny([
    "commande.creer",
    "commande.prendre",
    "commande.servir",
    "commande.annuler",
  ]);
  if (!acteur) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <ClipboardListIcon
            aria-hidden
            className="mx-auto size-8 text-muted-foreground"
          />
          <h1 className="mt-3 text-lg font-semibold">Commandes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre compte n&apos;a aucune permission sur les commandes.
            Demandez « commande.creer » ou « commande.prendre » à un
            administrateur.
          </p>
        </div>
      </div>
    );
  }

  const compte = await currentStaffAccount();
  const [queue, canServe, canCancel] = await Promise.all([
    readQueue(),
    compte ? aPermission(compte.id, "commande.servir") : false,
    compte ? aPermission(compte.id, "commande.annuler") : false,
  ]);
  const params = await searchParams;
  const message = params.ok ? (MESSAGES[params.ok] ?? params.ok) : null;

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 pt-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="outline">Comptoir</Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            File d&apos;attente
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Une commande se prend, puis se sert. Tant qu&apos;elle est prise,
            elle reste à vous ; passé quinze minutes sans service, elle
            retourne dans la file.
          </p>
        </div>
        <Link href="/agent/orders/new" className={buttonVariants()}>
          <PlusIcon aria-hidden />
          Nouvelle commande
        </Link>
      </header>

      {message ? (
        <p className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
          {message}
        </p>
      ) : null}
      {params.erreur ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {params.erreur}
        </p>
      ) : null}

      <OrderQueue
        commandes={queue}
        acteurId={acteur.id}
        canServe={canServe}
        canCancel={canCancel}
        retour="/agent/orders"
      />
    </div>
  );
}
