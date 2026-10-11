"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import {
  estClicDeNavigationInterne,
  estUneRequeteDeNavigation,
} from "@/lib/progression-navigation";

/**
 * Délai de sécurité, en ms : si ni le chemin ni aucun fetch ne signale la fin
 * (navigation résolue localement, clic sans effet), la barre se referme
 * d'elle-même au lieu de ramper.
 */
const DELAI_MAX_MS = 4000;

/**
 * La barre démarre de façon optimiste, dès le clic : Next précharge les liens
 * au survol et au défilement, donc un clic ordinaire n'émet souvent aucun
 * fetch — attendre le réseau, c'est rester invisible dans le cas courant.
 * Elle se referme au premier signal de fin : changement de chemin, réponse
 * du fetch de navigation, ou délai de sécurité.
 *
 * Partagé avec l'intercepteur de `fetch`, qui vit hors du cycle de vie React
 * et ne sert qu'à signaler les fins (jamais les démarrages) : les
 * `router.refresh()` périodiques de la scrutation des files (voir
 * `rafraichissement-file.tsx`) restent donc silencieux au comptoir.
 */
let terminerPartage: (() => void) | null = null;
let fetchOriginal: typeof fetch | null = null;
let poses = 0;

/** Intercepte `fetch` une seule fois, quel que soit le nombre de montages. */
function installerInterception() {
  if (fetchOriginal) return;
  fetchOriginal = window.fetch;
  window.fetch = (...args: Parameters<typeof fetch>) => {
    const termine = terminerPartage;
    const entetes = args[1]?.headers;
    if (!termine || !estUneRequeteDeNavigation(entetes)) {
      return fetchOriginal!(...args);
    }

    // La réponse (ou l'erreur) est retransmise telle quelle : intercepter ne
    // doit jamais changer ce que l'appelant reçoit.
    return fetchOriginal!(...args).then(
      (reponse) => {
        termine();
        return reponse;
      },
      (erreur) => {
        termine();
        throw erreur;
      },
    );
  };
}

function retirerInterception() {
  if (!fetchOriginal) return;
  window.fetch = fetchOriginal;
  fetchOriginal = null;
}

/**
 * Barre de progression des navigations, affichée en haut de l'écran.
 *
 * Pilotée par nprogress, qui injecte son propre DOM : ce composant ne rend
 * aucun élément visible, seulement une région d'état lue par les lecteurs
 * d'écran pendant le chargement.
 *
 * Volontairement silencieuse sur tout ce qui n'est pas une navigation
 * demandée par l'utilisateur dans l'onglet courant : préchargements Next,
 * `router.refresh()` des scrutations, server actions des formulaires (qui ont
 * déjà leur propre état d'attente).
 *
 * Rien n'est écrit ni lu ici : la synchronisation (S8) n'est pas concernée.
 */
export function ProgressionNavigation() {
  const [enCours, setEnCours] = useState(false);
  const pathname = usePathname();
  const demarre = useRef(false);
  const delaiMax = useRef(0);
  const premierRendu = useRef(true);

  useEffect(() => {
    NProgress.configure({
      minimum: 0.1,
      easing: "ease",
      speed: 300,
      trickleSpeed: 400,
      showSpinner: false,
    });

    let actif = true;

    // Idempotent : referme une seule fois, au premier signal de fin.
    const terminer = () => {
      if (!demarre.current) return;
      demarre.current = false;
      window.clearTimeout(delaiMax.current);
      NProgress.done();
      if (actif) setEnCours(false);
    };
    terminerPartage = terminer;

    const demarrer = () => {
      demarre.current = true;
      NProgress.start();
      if (actif) setEnCours(true);
      window.clearTimeout(delaiMax.current);
      delaiMax.current = window.setTimeout(terminer, DELAI_MAX_MS);
    };

    // Capture : s'exécute avant le gestionnaire de `next/link`.
    const auClic = (evenement: MouseEvent) => {
      const cible = evenement.target as Element | null;
      const ancre = cible?.closest?.("a") ?? null;
      if (!(ancre instanceof HTMLAnchorElement)) return;

      const navigue = estClicDeNavigationInterne({
        href: ancre.getAttribute("href"),
        target: ancre.target,
        rel: ancre.rel,
        telechargement: ancre.hasAttribute("download"),
        button: evenement.button,
        ctrlKey: evenement.ctrlKey,
        metaKey: evenement.metaKey,
        shiftKey: evenement.shiftKey,
        altKey: evenement.altKey,
        defaultPrevented: evenement.defaultPrevented,
        urlCourante: window.location.href,
      });
      if (navigue) demarrer();
    };

    /* Retour et avant du navigateur : navigation réelle sans lien cliqué. */
    const aLHistorique = () => demarrer();

    poses += 1;
    installerInterception();
    document.addEventListener("click", auClic, true);
    window.addEventListener("popstate", aLHistorique);

    return () => {
      actif = false;
      window.clearTimeout(delaiMax.current);
      document.removeEventListener("click", auClic, true);
      window.removeEventListener("popstate", aLHistorique);
      poses -= 1;
      if (poses === 0) {
        terminerPartage = null;
        retirerInterception();
        NProgress.remove();
      }
    };
  }, []);

  // Fin de navigation : le chemin a changé (couvre aussi les destinations
  // préchargées, qui n'émettent aucun fetch).
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    terminerPartage?.();
  }, [pathname]);

  if (!enCours) return null;

  return (
    <p role="status" className="sr-only">
      Chargement de la page
    </p>
  );
}
