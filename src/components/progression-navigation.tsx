"use client";

import { useEffect, useState } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import {
  estClicDeNavigationInterne,
  estUneRequeteDeNavigation,
} from "@/lib/progression-navigation";

/**
 * Fenêtre, en ms, pendant laquelle un fetch RSC est rattaché au geste qui l'a
 * provoqué. Passé ce délai, le geste expire sans rien afficher : la
 * destination venait du cache, du stockage local (application offline-first),
 * ou le clic n'a eu aucun effet.
 */
const FENETRE_GESTE_MS = 400;

/**
 * Partagé avec l'intercepteur de `fetch`, qui vit hors du cycle de vie React.
 * `attend` n'est vrai que dans l'instant qui suit un clic sur un lien
 * interne : c'est ce qui empêche les `router.refresh()` périodiques de la
 * scrutation des files (voir `rafraichissement-file.tsx`) de faire ramper la
 * barre en continu au comptoir.
 */
type EtatProgression = {
  attend: boolean;
  minuteur: number;
  enVol: number;
  ouvre: () => void;
  ferme: () => void;
};

let etat: EtatProgression | null = null;
let fetchOriginal: typeof fetch | null = null;
let poses = 0;

/** Intercepte `fetch` une seule fois, quel que soit le nombre de montages. */
function installerInterception() {
  if (fetchOriginal) return;
  fetchOriginal = window.fetch;
  window.fetch = (...args: Parameters<typeof fetch>) => {
    const courant = etat;
    const entetes = args[1]?.headers;
    if (!courant || !courant.attend || !estUneRequeteDeNavigation(entetes)) {
      return fetchOriginal!(...args);
    }

    courant.attend = false;
    window.clearTimeout(courant.minuteur);
    courant.enVol += 1;
    courant.ouvre();
    NProgress.start();

    const terminer = () => {
      courant.enVol -= 1;
      if (courant.enVol <= 0) NProgress.done();
      courant.ferme();
    };

    // La réponse (ou l'erreur) est retransmise telle quelle : intercepter ne
    // doit jamais changer ce que l'appelant reçoit.
    return fetchOriginal!(...args).then(
      (reponse) => {
        terminer();
        return reponse;
      },
      (erreur) => {
        terminer();
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
 * déjà leur propre état d'attente), et navigations résolues localement.
 *
 * Rien n'est écrit ni lu ici : la synchronisation (S8) n'est pas concernée.
 */
export function ProgressionNavigation() {
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    NProgress.configure({
      minimum: 0.1,
      easing: "ease",
      speed: 300,
      trickleSpeed: 400,
      showSpinner: false,
    });

    let actif = true;

    const progression: EtatProgression = {
      attend: false,
      minuteur: 0,
      enVol: 0,
      ouvre: () => {
        if (!actif) return;
        setEnCours(true);
      },
      ferme: () => {
        if (!actif) return;
        setEnCours(false);
      },
    };

    const armer = () => {
      progression.attend = true;
      window.clearTimeout(progression.minuteur);
      progression.minuteur = window.setTimeout(() => {
        progression.attend = false;
      }, FENETRE_GESTE_MS);
    };

    // Capture : s'exécute avant le gestionnaire de `next/link`, ce dernier
    // émettant le fetch dans la même frame. La fenêtre couvre le cas inverse.
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
      if (navigue) armer();
    };

    /* Retour et avant du navigateur : navigation réelle sans lien cliqué. */
    const aLHistorique = () => armer();

    etat = progression;
    poses += 1;
    installerInterception();
    document.addEventListener("click", auClic, true);
    window.addEventListener("popstate", aLHistorique);

    return () => {
      actif = false;
      window.clearTimeout(progression.minuteur);
      document.removeEventListener("click", auClic, true);
      window.removeEventListener("popstate", aLHistorique);
      poses -= 1;
      if (poses === 0) {
        etat = null;
        retirerInterception();
        NProgress.remove();
      }
    };
  }, []);

  if (!enCours) return null;

  return (
    <p role="status" className="sr-only">
      Chargement de la page
    </p>
  );
}
