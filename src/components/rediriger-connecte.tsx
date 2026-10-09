"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { demanderDestination } from "@/lib/destination-connexion";

// Miroir du GardienSession pour les pages publiques (ex. /sign-up, qui est
// un composant client et ne peut pas porter la garde serveur) : un compte
// déjà connecté qui rouvre la page (retour navigateur, lien) est renvoyé
// vers son espace au lieu de recommencer. INCONNU (anonyme, réseau coupé)
// : on reste — aucun verdict, aucune redirection (offline-first).
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
