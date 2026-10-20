import { OrderActions } from "@/components/orders/order-actions";
import { OrderRow } from "@/components/orders/order-row";
import type { OrderView } from "@/modules/orders/read";

function Section({
  titre,
  total,
  children,
}: {
  titre: string;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">{titre}</h2>
        <span className="text-xs tabular-nums text-muted-foreground">{total}</span>
      </div>
      {children}
    </section>
  );
}

export function OrderQueue({
  commandes,
  acteurId,
  canServe,
  canCancel,
  retour,
}: {
  commandes: OrderView[];
  acteurId: string;
  canServe: boolean;
  canCancel: boolean;
  retour: string;
}) {
  const disponibles = commandes.filter((commande) => commande.state === "QUEUED");
  const autres = commandes.filter((commande) => commande.state !== "QUEUED");

  if (commandes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-10 text-center">
        <p className="text-sm font-medium">Aucune commande ouverte.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Une commande au comptoir se crée en moins d&apos;une minute.
        </p>
      </div>
    );
  }

  const ligne = (commande: OrderView) => (
    <OrderRow key={commande.id} commande={commande}>
      <OrderActions
        orderId={commande.id}
        state={commande.state}
        mine={commande.lockedBy === acteurId}
        canServe={canServe}
        canCancel={canCancel}
        retour={retour}
      />
    </OrderRow>
  );

  return (
    <div className="flex flex-col gap-6">
      <Section titre="À prendre" total={disponibles.length}>
        {disponibles.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-xs text-muted-foreground">
            Rien en attente de prise.
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border bg-card">
            {disponibles.map(ligne)}
          </ul>
        )}
      </Section>

      {autres.length > 0 ? (
        <Section titre="En cours" total={autres.length}>
          <ul className="divide-y overflow-hidden rounded-lg border bg-card">
            {autres.map(ligne)}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
