"use client";

import { useEffect, useState } from "react";
import { FingerprintIcon, InboxIcon, WifiIcon, WifiOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DescriptionExpiration } from "./session-helpers";

/**
 * Bandeau-ticket d'état du poste, en tête de /agent/parametres.
 *
 * Trois repères d'un coup d'œil : réseau réel (`navigator.onLine`),
 * session (jours restants, déjà calculés par `decrireExpiration`), file
 * d'attente (compteur honnête en attente de S8 — rien n'est inventé).
 */
function useEtatReseau(): boolean {
  const [enLigne, setEnLigne] = useState<boolean>(() =>
    typeof navigator === "undefined" ||
    typeof navigator.onLine !== "boolean"
      ? true
      : navigator.onLine,
  );
  useEffect(() => {
    const connecter = () => setEnLigne(true);
    const couper = () => setEnLigne(false);
    window.addEventListener("online", connecter);
    window.addEventListener("offline", couper);
    return () => {
      window.removeEventListener("online", connecter);
      window.removeEventListener("offline", couper);
    };
  }, []);
  return enLigne;
}

export function EtatPosteBandeau({
  expiration,
}: {
  expiration: DescriptionExpiration;
}) {
  const enLigne = useEtatReseau();
  const sessionSensible = expiration.expiree || expiration.expireBientot;

  const sessionTexte =
    expiration.joursRestants === null
      ? "Inconnue"
      : expiration.expiree
        ? "Expirée — reconnectez-vous"
        : expiration.joursRestants <= 0
          ? "Dernier jour"
          : `${expiration.joursRestants} jour${expiration.joursRestants > 1 ? "s" : ""} restant${expiration.joursRestants > 1 ? "s" : ""}`;

  return (
    <section
      aria-label="État du poste"
      className="rounded-xl border border-dashed bg-card px-4 py-3"
    >
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {enLigne ? (
            <WifiIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <WifiOffIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Réseau</dt>
            <dd className="truncate text-sm font-medium">
              {enLigne ? "En ligne" : "Hors ligne — le travail continue"}
            </dd>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2.5">
          <FingerprintIcon
            className={cn(
              "size-4 shrink-0",
              sessionSensible
                ? "text-destructive"
                : "text-emerald-600 dark:text-emerald-400",
            )}
          />
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Session</dt>
            <dd className="truncate text-sm font-medium">{sessionTexte}</dd>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2.5">
          <InboxIcon className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">File d’attente</dt>
            <dd className="truncate text-sm font-medium">
              Comptage branché avec S8
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
