import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { OrderHistory } from "@/components/orders/order-history";
import { OrderQueue } from "@/components/orders/order-queue";
import { OrderReadout, type OrderStat } from "@/components/orders/order-readout";
import { PermissionRefusee } from "@/components/permission-denied";
import { aPermission } from "@/lib/authorizations/permissions";
import {
  currentStaffAccount,
  staffActorWithAny,
} from "@/lib/authorizations/staff-actor";
import {
  readOrderStats,
  readQueue,
  readRecentOrders,
} from "@/modules/orders/read";

export const metadata: Metadata = {
  title: "Commandes — Administration — TKS",
  description:
    "Toutes les commandes, tous agents confondus : file ouverte et historique.",
};

const MESSAGES: Record<string, string> = {
  "order-taken": "Commande prise.",
  "order-served": "Commande servie.",
  "order-cancelled": "Commande annulée.",
};

function montant(valeur: number, devise: string): string {
  return `${valeur.toLocaleString("fr-FR")} ${devise}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const acteur = await staffActorWithAny([
    "commande.prendre",
    "commande.servir",
    "commande.annuler",
  ]);
  if (!acteur) {
    return (
      <PermissionRefusee
        titre="Commandes"
        detail="Le pilotage des commandes exige au moins la permission « commande.prendre »."
        action="Le socle de permissions l'accorde déjà à tout agent de service validé."
      />
    );
  }

  const compte = await currentStaffAccount();
  const [queue, recents, stats, canServe, canCancel] = await Promise.all([
    readQueue(),
    readRecentOrders(15),
    readOrderStats(),
    compte ? aPermission(compte.id, "commande.servir") : false,
    compte ? aPermission(compte.id, "commande.annuler") : false,
  ]);
  const params = await searchParams;
  const message = params.ok ? (MESSAGES[params.ok] ?? params.ok) : null;

  const lecture: OrderStat[] = [
    {
      label: "Commandes ouvertes",
      value: String(stats.ouvertes),
      hint: stats.aPrendre
        ? `${stats.aPrendre} à prendre`
        : "aucune à prendre",
      accent: stats.aPrendre > 0,
    },
    {
      label: "En main d'un agent",
      value: String(stats.enCours),
      hint: "verrou de quinze minutes",
    },
    {
      label: "Preuve attendue",
      value: String(stats.preuveAttendue),
      hint: "le client doit déposer",
      accent: stats.preuveAttendue > 0,
    },
    {
      label: "Engagé à crédit",
      value:
        stats.engageCredit.length === 0
          ? "0"
          : montant(
              stats.engageCredit[0].amount,
              stats.engageCredit[0].currency,
            ),
      hint: stats.engageCredit.length > 1 ? "plusieurs devises" : "à recouvrer",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 pt-4">
      <header>
        <Badge variant="outline">Pilotage</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Toutes les commandes
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          La file est partagée : l&apos;administrateur voit les commandes de
          tous les agents, et sait qui tient laquelle. Une commande à crédit
          servie devient une créance.
        </p>
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

      <OrderReadout stats={lecture} />

      <OrderQueue
        commandes={queue}
        acteurId={acteur.id}
        canServe={canServe}
        canCancel={canCancel}
        retour="/admin/orders"
      />

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Dernières commandes terminées</h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {recents.length}
          </span>
        </div>
        <OrderHistory commandes={recents} />
      </section>
    </div>
  );
}
