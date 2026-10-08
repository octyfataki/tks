import { nomAffiche } from "./affichage-admin";

export type FiltreDemande =
  | "principal"
  | "technique"
  | "valide"
  | "suspendu"
  | "revoque"
  | "sans-2fa";

export type TriDemande = "anciens" | "nom-az" | "nom-za";

/** Sous-ensemble de colonnes qu'exigent le filtrage et le tri. */
export type LigneFiltrable = {
  role: string;
  etat: string;
  facteurActif: boolean | null;
  nom: string | null;
  email: string;
  telephone: string | null;
  createdAt: Date;
};

/** Filtre unique (?filtre=) + recherche (?q=, normalisée ici). */
export function filtrerLignes<T extends LigneFiltrable>(
  lignes: T[],
  recherche: string,
  filtre: FiltreDemande | null,
): T[] {
  const q = recherche.trim().toLowerCase();
  return lignes.filter((ligne) => {
    if (filtre === "principal" && ligne.role !== "ADMIN_PRINCIPAL")
      return false;
    if (filtre === "technique" && ligne.role !== "ADMIN_TECHNIQUE")
      return false;
    if (filtre === "valide" && ligne.etat !== "VALIDE") return false;
    if (filtre === "suspendu" && ligne.etat !== "SUSPENDU") return false;
    if (filtre === "revoque" && ligne.etat !== "REVOQUE") return false;
    if (filtre === "sans-2fa" && ligne.facteurActif !== null) return false;
    if (q) {
      const nom = (ligne.nom?.trim() || ligne.email).toLowerCase();
      const telephone = (ligne.telephone || "").toLowerCase();
      if (
        !nom.includes(q) &&
        !ligne.email.toLowerCase().includes(q) &&
        !telephone.includes(q)
      )
        return false;
    }
    return true;
  });
}

/** Tri (?tri=), défaut : plus récents. Ne mute jamais l'entrée. */
export function trierLignes<T extends LigneFiltrable>(
  lignes: T[],
  tri: TriDemande | null,
): T[] {
  return [...lignes].sort((a, b) => {
    if (tri === "anciens") return a.createdAt.getTime() - b.createdAt.getTime();
    if (tri === "nom-az") return nomAffiche(a).localeCompare(nomAffiche(b), "fr");
    if (tri === "nom-za") return nomAffiche(b).localeCompare(nomAffiche(a), "fr");
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}
