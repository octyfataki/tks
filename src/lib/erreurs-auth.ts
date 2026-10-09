// Traduction des erreurs renvoyées par Better Auth (client) : l'API livre ses
// libellés en anglais, l'utilisateur ne doit jamais les voir. On traduit par
// code, puis par statut HTTP (le rate limit 429 n'a pas de code), puis repli
// français générique — jamais le message brut. Un code inconnu est signalé en
// console en dev pour étoffer le catalogue.
//
// Utilisé par le formulaire de connexion (sign-in) et celui du second facteur
// (verify-2fa, OTP par SMS ou par email), qui partagent les mêmes défauts.

// Erreur telle que rendue par le client Better Auth : code et message viennent
// du corps JSON de l'API, status/statusText du fetch. Les propriétés du corps
// sont optionnelles (le rate limit 429 n'envoie qu'un message).
type ErreurAuth = {
  code?: string;
  message?: string;
  status?: number;
} | null | undefined;

// Coupure réseau : le navigateur rejette le fetch par un TypeError. Message
// partagé par les deux formulaires.
export const MESSAGE_RESEAU = "Impossible de joindre le serveur. Vérifiez votre connexion.";

const TROP_DE_TENTATIVES = "Trop de tentatives. Réessayez dans une minute.";

// Codes atteignables sur POST /sign-in/email (src/lib/auth.ts, rate limit 5/60 s).
const CONNEXION: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe incorrect.",
  INVALID_EMAIL: "Adresse email invalide.",
  FAILED_TO_CREATE_SESSION: "Impossible d'ouvrir la session. Réessayez.",
};

// Codes atteignables sur POST /two-factor/verify-otp et POST
// /two-factor/send-otp (OTP SMS ou email, une seule méthode demandée), plus
// POST /api/2fa/envoyer-code qui relaye ces codes et ajoute CANAL_INCONNU.
const SECOND_FACTEUR: Record<string, string> = {
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

function traduire(erreur: ErreurAuth, catalogue: Record<string, string>, generique: string): string {
  const code = erreur?.code;
  if (code && code in catalogue) return catalogue[code];
  // Le rate limit 429 ne porte pas de code (corps réduit à `message`) : on le
  // reconnaît au statut HTTP.
  if (erreur?.status === 429) return TROP_DE_TENTATIVES;
  // Repli : libellé français générique, jamais l'anglais reçu. Un code non
  // traduit sort en console (dev) pour étendre le catalogue si besoin.
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