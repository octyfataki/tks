// Ligne d'admin telle qu'affichée dans /admin/list. Dates sérialisées
// (ISO) pour traverser la frontière serveur → client (export CSV).
export type LigneAdmin = {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  role: "ADMIN_PRINCIPAL" | "ADMIN_TECHNIQUE";
  etat: "VALIDE" | "REVOQUE";
  creeLe: string;
  creePar: string | null;
};

export type FiltreAdmin = {
  role?: "ADMIN_PRINCIPAL" | "ADMIN_TECHNIQUE";
  etat?: "VALIDE" | "REVOQUE";
  q?: string;
  page: number;
};

export const LIGNES_PAR_PAGE = 10;
