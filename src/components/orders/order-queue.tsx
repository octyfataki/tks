import { OrderRegister } from "@/components/orders/order-register";
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
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm font-medium">Aucune commande ouverte</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Une commande au comptoir se crée en moins d&apos;une minute.
        </p>
      </div>
    );
  }

  const registre = (liste: OrderView[]) => (
    <OrderRegister
      commandes={liste}
      acteurId={acteurId}
      canServe={canServe}
      canCancel={canCancel}
      retour={retour}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      {disponibles.length > 0 ? (
        <Section titre="À prendre" total={disponibles.length}>
          {registre(disponibles)}
        </Section>
      ) : null}

      {autres.length > 0 ? (
        <Section titre="En cours" total={autres.length}>
          {registre(autres)}
        </Section>
      ) : null}
    </div>
  );
}
