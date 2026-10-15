"use client";

import { useEffect, useState } from "react";
import { AppLoader } from "@/components/app-loader";
import { cn } from "@/lib/utils";

export function AppSplash() {
  const [fondu, setFondu] = useState(false);
  const [retire, setRetire] = useState(false);

  useEffect(() => {
    const reduit = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const visibleMs = reduit ? 0 : 700;
    const fonduMs = reduit ? 0 : 350;
    const t1 = window.setTimeout(() => setFondu(true), visibleMs);
    const t2 = window.setTimeout(
      () => setRetire(true),
      visibleMs + fonduMs,
    );
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (retire) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-[100] transition-opacity duration-300",
        fondu && "pointer-events-none opacity-0",
      )}
    >
      <AppLoader />
    </div>
  );
}
