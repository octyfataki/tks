const LIBELLES_ROLE: Record<string, string> = {
  ADMIN_PRINCIPAL: "Administrateur principal",
  ADMIN_TECHNIQUE: "Administrateur technique",
  AGENT: "Agent de service",
};

/** Rôle staff toujours qualifié (glossaire : jamais « administrateur » seul). */
export function libelleRole(role: string): string {
  return LIBELLES_ROLE[role] ?? role;
}

/** Initiales d'avatar : deux premières lettres des mots extrêmes. */
export function initiales(nom: string): string {
  const lettres = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join("");
  return lettres || "AD";
}

/** Nom affiché : nom better-auth, sinon préfixe email, sinon repli neutre. */
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
