import { TriangleAlertIcon } from "lucide-react";
import type { OrderIllisible } from "@/modules/orders/read";

export function OrderIllisibles({ illisibles }: { illisibles: OrderIllisible[] }) {
  if (illisibles.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-amber-900 text-sm dark:text-amber-300"
    >
      <div className="flex items-center gap-2">
        <TriangleAlertIcon aria-hidden className="size-4 shrink-0" />
        <p className="font-medium">
          {illisibles.length === 1
            ? "1 commande à l'état illisible"
            : `${illisibles.length} commandes à l'état illisible`}
        </p>
      </div>
      <p className="mt-1 text-xs">
        Leurs événements ne décrivent pas un état lisible ; elles sont absentes
        de la file et du registre en attendant une correction.
      </p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {illisibles.map((illisible) => (
          <li key={illisible.id} className="text-xs">
            <span className="font-medium tabular-nums">
              {illisible.id.slice(0, 8)}
            </span>{" "}
            — {illisible.raison}
          </li>
        ))}
      </ul>
    </div>
  );
}
