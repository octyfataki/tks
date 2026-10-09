// Méthode d'envoi du code 2FA (GLOSSARY : « canal » est réservé aux
// commandes — ici « méthode » : sms ou email).
//
// Le choix transite par une ligne `verification` d'identifiant
// `2fa-methode-<défi>` (10 min, même durée que le défi 2FA), écrite par
// POST /api/2fa/envoyer-code et lue par le mock d'envoi (src/lib/auth.ts).
// La clé reprend le jeton de défi BRUT (sans la signature) : c'est la
// représentation que better-auth utilise des deux côtés (getSignedCookie
// renvoie la valeur avant le dernier « . », qui sépare la signature de
// 44 caractères). Comparer avec la valeur signée complète raterait toujours
// la préférence — avec repli double envoi silencieux.

export const METHODES_ENVOI_2FA = ["sms", "email"] as const;
export type MethodeEnvoi2fa = (typeof METHODES_ENVOI_2FA)[number];

export function estMethodeEnvoi2fa(valeur: unknown): valeur is MethodeEnvoi2fa {
  return valeur === "sms" || valeur === "email";
}

/** Clé de préférence pour un jeton de défi brut (`2fa-<aléa>`). */
export function clePreferenceMethode2fa(defi: string): string {
  return `2fa-methode-${defi}`;
}

// Jeton de défi brut depuis l'en-tête Cookie : même représentation que
// better-auth (cookie parsé puis pourcent-décodé une fois, signature
// `.<44 caractères>=` retirée). Tout autre contenu est refusé : la
// préférence ne doit jamais être écrite sous une clé devinable ou vide.
export function lireDefi2fa(cookie: string): string | null {
  const trouve =
    /(?:^|;\s*)((?:__Secure-|__Host-)?better-auth\.two_factor)=([^;]*)/.exec(
      cookie,
    );
  if (!trouve) return null;
  const brut = trouve[2].trim();
  let clair = brut;
  if (brut.includes("%")) {
    try {
      clair = decodeURIComponent(brut);
    } catch {
      clair = brut;
    }
  }
  const point = clair.lastIndexOf(".");
  const jeton = point > 0 ? clair.slice(0, point) : clair;
  return jeton.startsWith("2fa-") ? jeton : null;
}
