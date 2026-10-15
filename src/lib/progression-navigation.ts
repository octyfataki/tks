export const ENTETE_RSC = "RSC";

export const ENTETE_PREFETCH_RSC = "Next-Router-Prefetch";

export const ENTETE_ACTION = "Next-Action";

export const ENTETE_PURPOSE = "purpose";

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

export function estUnPrefetch(entetes: EntetesRequete): boolean {
  if (!entetes) return false;
  if (lireEntete(entetes, ENTETE_PURPOSE) === "prefetch") return true;
  return lireEntete(entetes, ENTETE_PREFETCH_RSC) !== null;
}

export function estUneServerAction(entetes: EntetesRequete): boolean {
  return lireEntete(entetes, ENTETE_ACTION) !== null;
}

export function estUneRequeteDeNavigation(entetes: EntetesRequete): boolean {
  if (!entetes) return false;
  if (estUnPrefetch(entetes)) return false;
  if (estUneServerAction(entetes)) return false;
  return lireEntete(entetes, ENTETE_RSC) !== null;
}

export type ClicSurLien = {
  href: string | null | undefined;
  target?: string | null;
  rel?: string | null;
  telechargement?: boolean;
  button?: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
  urlCourante: string;
};

function memeDestination(destination: URL, urlCourante: URL): boolean {
  if (destination.origin !== urlCourante.origin) return true;
  return (
    destination.pathname === urlCourante.pathname &&
    destination.search === urlCourante.search
  );
}

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
  return !memeDestination(destination, courante);
}
