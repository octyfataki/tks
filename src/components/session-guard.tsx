"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-client";

const DELAI_VERIFICATION_MS = 60_000;

export function GardienSession() {
  const routeur = useRouter();
  const dejaParti = React.useRef(false);

  const verifier = React.useCallback(async () => {
    if (dejaParti.current) return;
    let session: unknown;
    try {
      ({ data: session } = await getSession());
    } catch {
      return;
    }
    if (!session) {
      dejaParti.current = true;
      routeur.push("/sign-in");
      routeur.refresh();
    }
  }, [routeur]);

  React.useEffect(() => {
    void verifier();
    const minuteur = window.setInterval(() => {
      if (document.visibilityState === "visible") void verifier();
    }, DELAI_VERIFICATION_MS);
    const surRetour = () => {
      if (document.visibilityState !== "hidden") void verifier();
    };
    window.addEventListener("focus", surRetour);
    window.addEventListener("online", surRetour);
    document.addEventListener("visibilitychange", surRetour);
    return () => {
      window.clearInterval(minuteur);
      window.removeEventListener("focus", surRetour);
      window.removeEventListener("online", surRetour);
      document.removeEventListener("visibilitychange", surRetour);
    };
  }, [verifier]);

  return null;
}
