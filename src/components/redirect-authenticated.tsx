"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { demanderDestination } from "@/lib/post-login-redirect";

export function RedirigerConnecte() {
  const routeur = useRouter();
  const chemin = usePathname();

  React.useEffect(() => {
    let annule = false;
    void demanderDestination().then((reponse) => {
      if (
        !annule &&
        reponse.code !== "INCONNU" &&
        reponse.destination !== chemin
      ) {
        routeur.push(reponse.destination);
      }
    });
    return () => {
      annule = true;
    };
  }, [routeur, chemin]);

  return null;
}
