const LIBELLES_ROLE: Record<string, string> = {
  ADMIN_PRINCIPAL: "Administrateur principal",
  ADMIN_TECHNIQUE: "Administrateur technique",
  AGENT: "Agent de service",
};

export function libelleRole(role: string): string {
  return LIBELLES_ROLE[role] ?? role;
}

export function initiales(nom: string): string {
  const lettres = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join("");
  return lettres || "AD";
}

export function nomAffiche(ligne: {
  nom: string | null;
  email: string;
}): string {
  return ligne.nom?.trim() || ligne.email.split("@")[0] || "Compte";
}

export function dateCourte(valeur: Date): string {
  return valeur.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
