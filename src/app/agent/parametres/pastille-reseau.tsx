"use client";

import { useEffect, useState } from "react";
import { WifiIcon, WifiOffIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PastilleReseau() {
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

  return (
    <Badge variant="outline" aria-live="polite">
      {enLigne ? (
        <WifiIcon aria-hidden />
      ) : (
        <WifiOffIcon aria-hidden />
      )}
      {enLigne ? "En ligne" : "Hors ligne"}
    </Badge>
  );
}
