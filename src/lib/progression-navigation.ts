// Progression de navigation — logique de décision, sans accès au DOM.
//
// Deux phénomènes doivent rester silencieux, parce qu'ils sont permanents et
// non désirés au comptoir :
//
//   1. les préchargements que Next déclenche tout seul (survol, viewport) ;
//   2. les `router.refresh()` périodiques de la scrutation des files
//      (voir `rafraichissement-file.tsx`), qui sans garde feraient ramper la
//      barre en continu toute la journée.
//
// D'où un double verrou, réparti en deux couches :
//   - ce module dit si un clic ou un fetch a la *forme* d'une navigation ;
//   - le composant décide si quelqu'un attend, en n'ouvrant la barre que sur
//     un geste de l'utilisateur.
//
// L'application étant offline-first, une navigation résolue depuis les
// données locales n'émet aucun fetch : rien ne s'affiche, ce qui est juste.

/** En-tête posé par Next sur toute requête RSC (navigation comprise). */
export const ENTETE_RSC = "RSC";

/** En-tête qu'un préchargement RSC joint pour se faire reconnaître. */
export const ENTETE_PREFETCH_RSC = "Next-Router-Prefetch";

/** En-tête qu'une server action joint à sa requête. */
export const ENTETE_ACTION = "Next-Action";

/** En-tête navigateur marquant un préchargement de lien. */
export const ENTETE_PURPOSE = "purpose";

/** Formes acceptées par `fetch` pour son argument `init.headers`. */
type EntetesRequete = HeadersInit | undefined;

function lireEntete(entetes: EntetesRequete, nom: string): string | null {
  if (!entetes) return null;
  const cherche = nom.toLowerCase();

  if (typeof Headers !== "undefined" && entetes instanceof Headers) {
    return entetes.get(nom);
  }
  if (Array.isArray(entetes)) {
    for (const entree of entetes) {
      if (entree[0].toLowerCase() === cherche) return entree[1];
    }
    return null;
  }
  if (typeof entetes === "object") {
    for (const [cle, valeur] of Object.entries(entetes)) {
      if (cle.toLowerCase() === cherche && typeof valeur === "string") {
        return valeur;
      }
    }
  }
  return null;
}

/**
 * Un préchargement ne doit jamais faire avancer la barre : il part sans que
 * personne n'ait rien demandé, et à répétition pendant le défilement.
 */
export function estUnPrefetch(entetes: EntetesRequete): boolean {
  if (!entetes) return false;
  if (lireEntete(entetes, ENTETE_PURPOSE) === "prefetch") return true;
  return lireEntete(entetes, ENTETE_PREFETCH_RSC) !== null;
}

/**
 * Une server action est exclue : les formulaires affichent déjà leur propre
 * état d'attente (bouton désactivé, toast de résultat). Une barre par-dessus
 * doublerait le signal au lieu de le renforcer.
 */
export function estUneServerAction(entetes: EntetesRequete): boolean {
  return lireEntete(entetes, ENTETE_ACTION) !== null;
}

/**
 * true si le fetch est une navigation RSC « réelle » : chargement de page ou
 * rafraîchissement. Ne dit rien de son opportunité — voir le composant, qui
 * vérifie qu'un geste l'a provoquée.
 */
export function estUneRequeteDeNavigation(entetes: EntetesRequete): boolean {
  if (!entetes) return false;
  if (estUnPrefetch(entetes)) return false;
  if (estUneServerAction(entetes)) return false;
  return lireEntete(entetes, ENTETE_RSC) !== null;
}

/** Ce qu'il faut connaître d'un clic pour décider s'il navigue. */
export type ClicSurLien = {
  /** Attribut `href` brut de l'ancre cliquée. */
  href: string | null | undefined;
  target?: string | null;
  rel?: string | null;
  /** true si l'attribut `download` est présent, même sans valeur. */
  telechargement?: boolean;
  /** 0 = clic gauche uniquement. */
  button?: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
  /** URL courante, servant de base aux `href` relatifs. */
  urlCourante: string;
};

function memeDestination(destination: URL, urlCourante: URL): boolean {
  if (destination.origin !== urlCourante.origin) return true;
  return (
    destination.pathname === urlCourante.pathname &&
    destination.search === urlCourante.search
  );
}

/**
 * true si le clic déclenche une navigation interne dans l'onglet courant.
 *
 * Exclut tout ce qui n'est pas une navigation dans cet onglet : nouvel onglet
 * (modificateurs, `target`), téléchargement, lien externe, ancre de même
 * page, protocole non http (mailto, tel, javascript). Ce dernier cas est
 * vérifié après résolution, pour couvrir les `href` relatifs.
 */
export function estClicDeNavigationInterne(clic: ClicSurLien): boolean {
  if (clic.defaultPrevented) return false;
  if (!clic.href) return false;
  if ((clic.button ?? 0) !== 0) return false;
  if (clic.ctrlKey || clic.metaKey || clic.shiftKey || clic.altKey) return false;
  if (clic.telechargement) return false;

  const cible = clic.target?.toLowerCase();
  if (cible && cible !== "_self") return false;

  const rel = clic.rel?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  if (rel.includes("external")) return false;

  let courante: URL;
  let destination: URL;
  try {
    courante = new URL(clic.urlCourante);
    destination = new URL(clic.href, courante);
  } catch {
    return false;
  }

  if (destination.protocol !== "http:" && destination.protocol !== "https:") {
    return false;
  }
  // Un clic qui ne change ni le chemin ni les paramètres ne navigue pas.
  return !memeDestination(destination, courante);
}
