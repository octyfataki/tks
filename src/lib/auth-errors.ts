export type ErreurAuth = {
  code?: string;
  message?: string;
  status?: number;
  body?: { code?: string } | null;
} | null | undefined;

export const MESSAGE_RESEAU = "Impossible de joindre le serveur. Vérifiez votre connexion.";

const TROP_DE_TENTATIVES = "Trop de tentatives. Réessayez dans une minute.";

const CONNEXION: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe incorrect.",
  INVALID_EMAIL: "Adresse email invalide.",
  FAILED_TO_CREATE_SESSION: "Impossible d'ouvrir la session. Réessayez.",
};

const SECOND_FACTEUR: Record<string, string> = {
  INVALID_PASSWORD: "Mot de passe incorrect.",
  INVALID_CODE: "Code incorrect.",
  OTP_HAS_EXPIRED: "Code expiré. Demandez un nouveau code.",
  OTP_NOT_ENABLED: "Envoi du code indisponible. Demandez un nouveau code.",
  OTP_NOT_CONFIGURED: "Envoi du code indisponible. Demandez un nouveau code.",
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "Trop de tentatives. Demandez un nouveau code.",
  ACCOUNT_TEMPORARILY_LOCKED: "Trop d'échecs : compte temporairement bloqué. Réessayez plus tard.",
  INVALID_TWO_FACTOR_COOKIE: "Vérification expirée : reconnectez-vous.",
  FAILED_TO_CREATE_SESSION: "Impossible d'ouvrir la session. Réessayez.",
  CANAL_INCONNU: "Méthode inconnue. Recommencez.",
  ENVOI_REFUSE: "Envoi refusé. Réessayez.",
};

const MOT_DE_PASSE: Record<string, string> = {
  INVALID_PASSWORD: "Mot de passe actuel incorrect.",
  PASSWORD_TOO_SHORT: "Le nouveau mot de passe est trop court.",
  PASSWORD_TOO_LONG: "Le nouveau mot de passe est trop long.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Ce compte n'a pas de mot de passe.",
  SESSION_EXPIRED: "Session expirée : reconnectez-vous.",
};

function traduire(erreur: ErreurAuth, catalogue: Record<string, string>, generique: string): string {
  const code = erreur?.code ?? erreur?.body?.code ?? undefined;
  if (code && code in catalogue) return catalogue[code];
  if (erreur?.status === 429) return TROP_DE_TENTATIVES;
  if (erreur?.message && process.env.NODE_ENV !== "production") {
    console.warn(`[erreurs-auth] code non traduit : ${code ?? "(sans code)"} — ${erreur.message}`);
  }
  return generique;
}

export function messageErreurConnexion(erreur: ErreurAuth): string {
  return traduire(erreur, CONNEXION, "Connexion refusée. Réessayez.");
}

export function messageErreurSecondFacteur(erreur: ErreurAuth): string {
  return traduire(erreur, SECOND_FACTEUR, "Code refusé. Réessayez.");
}
export function messageErreurChangementMotDePasse(erreur: ErreurAuth): string {
  return traduire(erreur, MOT_DE_PASSE, "Changement refusé. Reessayez.");
}
