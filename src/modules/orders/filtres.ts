import type { OrderView } from "./read";

export const ETATS_FILTRABLES = [
  "QUEUED",
  "LOCKED",
  "AWAITING_PROOF",
  "SERVED",
  "CANCELLED",
] as const;

export const RESEAUX_FILTRABLES = [
  "ORANGE",
  "AIRTEL",
  "AFRICELL",
  "VODACOM",
] as const;

export const TYPES_FILTRABLES = ["PREPAID", "CREDIT"] as const;

export const PERIODES_FILTRABLES = ["jour", "7j", "30j"] as const;

export const TRIS_FILTRABLES = ["recents", "anciens", "montant"] as const;

export type FiltresCommandes = {
  q: string;
  etat: string;
  reseau: string;
  type: string;
  periode: string;
  tri: string;
};

export function filtresVides(): FiltresCommandes {
  return { q: "", etat: "", reseau: "", type: "", periode: "", tri: "" };
}

function dansListe(valeurs: readonly string[], valeur: string): string {
  return valeurs.includes(valeur) ? valeur : "";
}

export function normaliserFiltres(
  valeurs: Partial<FiltresCommandes>,
): FiltresCommandes {
  return {
    q: (valeurs.q ?? "").trim(),
    etat: dansListe(ETATS_FILTRABLES, valeurs.etat ?? ""),
    reseau: dansListe(RESEAUX_FILTRABLES, valeurs.reseau ?? ""),
    type: dansListe(TYPES_FILTRABLES, valeurs.type ?? ""),
    periode: dansListe(PERIODES_FILTRABLES, valeurs.periode ?? ""),
    tri: dansListe(TRIS_FILTRABLES, valeurs.tri ?? ""),
  };
}

export function filtresActifs(filtres: FiltresCommandes): boolean {
  return Boolean(
    filtres.q ||
      filtres.etat ||
      filtres.reseau ||
      filtres.type ||
      filtres.periode ||
      filtres.tri,
  );
}

function sansEspaces(valeur: string): string {
  return valeur.replace(/[\s.\-()]/g, "").toLowerCase();
}

function debutPeriode(periode: string, maintenant: Date): Date | null {
  if (periode === "jour") {
    const jour = new Date(maintenant);
    jour.setHours(0, 0, 0, 0);
    return jour;
  }
  if (periode === "7j" || periode === "30j") {
    const jours = periode === "7j" ? 7 : 30;
    const debut = new Date(maintenant);
    debut.setDate(debut.getDate() - jours);
    debut.setHours(0, 0, 0, 0);
    return debut;
  }
  return null;
}

export function filtreCommandes(
  commandes: readonly OrderView[],
  filtres: FiltresCommandes,
  maintenant: Date = new Date(),
): OrderView[] {
  const recherche = sansEspaces(filtres.q);
  const debut = debutPeriode(filtres.periode, maintenant);
  return commandes.filter((commande) => {
    if (filtres.etat && commande.state !== filtres.etat) return false;
    if (filtres.reseau && commande.network !== filtres.reseau) return false;
    if (filtres.type && commande.type !== filtres.type) return false;
    if (debut && commande.createdAt < debut) return false;
    if (recherche) {
      const nom = sansEspaces(commande.profileName);
      const telephone = sansEspaces(commande.profilePhone);
      if (!nom.includes(recherche) && !telephone.includes(recherche)) {
        return false;
      }
    }
    return true;
  });
}

export function trieCommandes(
  commandes: readonly OrderView[],
  tri: string,
): OrderView[] {
  const triees = [...commandes];
  if (tri === "anciens") {
    triees.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return triees;
  }
  if (tri === "montant") {
    triees.sort(
      (a, b) =>
        b.amount - a.amount || b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return triees;
  }
  triees.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return triees;
}
