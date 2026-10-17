"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ||
    typeof navigator.onLine !== "boolean"
      ? true
      : navigator.onLine,
  );
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return isOnline;
}

function StatusRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "ok" | "warning" | "neutral";
}) {
  const dotColor =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warning"
        ? "bg-destructive"
        : "bg-muted-foreground/40";
  return (
    <li className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${dotColor}`} />
        <span className="truncate text-[13px] text-muted-foreground">{label}</span>
      </span>
      <span className="shrink-0 text-right text-[13px] font-semibold text-foreground tabular-nums">
        {value}
      </span>
    </li>
  );
}

export function SyncSection() {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-dashed">
        <StatusRow
          label="État du réseau"
          value={isOnline ? "En ligne" : "Hors ligne — on continue"}
          tone={isOnline ? "ok" : "warning"}
        />
        <StatusRow
          label="Écritures en attente"
          value="Comptage S8"
        />
        <StatusRow
          label="Dernière synchro"
          value="Pas encore suivie"
        />
        <StatusRow
          label="Taux embarqué"
          value="Avec S3, daté"
        />
      </ul>
      <p className="rounded-md bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        La session survit à la coupure réseau mais expire quand même. La
        révocation d’un compte n’agit qu’à la synchronisation : en cas de
        téléphone perdu ou volé, prévenez le distributeur sans attendre.
      </p>
      <div className="flex flex-col gap-2">
        <Button type="button" disabled className="self-start">
          Synchroniser maintenant
        </Button>
        <p className="text-xs text-muted-foreground">
          La synchro manuelle arrive avec S8 : déclenchée par l’appareil, sans
          doublon.
        </p>
      </div>
    </div>
  );
}