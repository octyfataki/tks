"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import {
  estClicDeNavigationInterne,
  estUneRequeteDeNavigation,
} from "@/lib/progression-navigation";

const DELAI_MAX_MS = 4000;

let terminerPartage: (() => void) | null = null;
let fetchOriginal: typeof fetch | null = null;
let poses = 0;

function installerInterception() {
  if (fetchOriginal) return;
  fetchOriginal = window.fetch;
  window.fetch = (...args: Parameters<typeof fetch>) => {
    const termine = terminerPartage;
    const entetes = args[1]?.headers;
    if (!termine || !estUneRequeteDeNavigation(entetes)) {
      return fetchOriginal!(...args);
    }

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
