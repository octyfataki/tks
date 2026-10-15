export type LigneAdmin = {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  role: "ADMIN_PRINCIPAL" | "ADMIN_TECHNIQUE";
  etat: "VALIDE" | "SUSPENDU" | "REVOQUE";
  creeLe: string;
  creePar: string | null;
};

export type FiltreAdmin = {
  role?: "ADMIN_PRINCIPAL" | "ADMIN_TECHNIQUE";
  etat?: "VALIDE" | "SUSPENDU" | "REVOQUE";
  q?: string;
  page: number;
};

export const LIGNES_PAR_PAGE = 10;
