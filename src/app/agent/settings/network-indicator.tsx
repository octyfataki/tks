"use client";

import { useEffect, useState } from "react";
import { WifiIcon, WifiOffIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function NetworkIndicator() {
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

  return (
    <Badge variant="outline" aria-live="polite">
      {isOnline ? (
        <WifiIcon aria-hidden />
      ) : (
        <WifiOffIcon aria-hidden />
      )}
      {isOnline ? "En ligne" : "Hors ligne"}
    </Badge>
  );
}
