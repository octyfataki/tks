"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  cancelOrderAction,
  serveOrderAction,
  takeOrderAction,
} from "@/modules/orders/actions";

function PendingButton({
  children,
  variant,
  confirm,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      variant={variant ?? "default"}
      disabled={pending}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {pending ? "…" : children}
    </Button>
  );
}

export function OrderActions({
  orderId,
  state,
  mine,
  canServe,
  canCancel,
  retour,
}: {
  orderId: string;
  state: string;
  mine: boolean;
  canServe: boolean;
  canCancel: boolean;
  retour: string;
}) {
  const actions: React.ReactNode[] = [];

  if (state === "QUEUED") {
    actions.push(
      <form key="prendre" action={takeOrderAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="retour" value={retour} />
        <PendingButton>Prendre</PendingButton>
      </form>,
    );
  }

  if (state === "LOCKED" && mine && canServe) {
    actions.push(
      <form key="servir" action={serveOrderAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="retour" value={retour} />
        <PendingButton>Servir</PendingButton>
      </form>,
    );
  }

  if (canCancel && state !== "SERVED" && state !== "CANCELLED") {
    actions.push(
      <form key="annuler" action={cancelOrderAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="retour" value={retour} />
        <PendingButton
          variant="outline"
          confirm="Annuler cette commande ? Cette action est définitive."
        >
          Annuler
        </PendingButton>
      </form>,
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">{actions}</div>
  );
}
