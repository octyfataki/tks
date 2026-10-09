import type {
  EtatClient,
  EtatStaff,
  RoleStaff,
} from "@/lib/db/schema/s1-comptes";
// S1 — Routage par rôle. Logique pure : ni BDD, ni framework, ni session.
// Le rôle n'est PAS dans la session better-auth, il vient de comptes_staff
// (résolution dans profil-session.ts). Vocabulaire : GLOSSARY, rôles et
// états : schema/s1-comptes/validation.ts.

/** Où atterrit un administrateur. */
export const DESTINATION_ADMIN = "/admin";
/** Où atterrit un agent de service. */
export const DESTINATION_AGENT = "/agent";
/** Où atterrit un client. */
export const DESTINATION_CLIENTS = "/clients";
/** Où atterrit un client en attente ou refusé : il voit son état avancer. */
export const DESTINATION_ATTENTE = "/pending";
/** Repli : anonyme, révocation, profil illisible. */
export const DESTINATION_CONNEXION = "/sign-in";

/** Un espace = une arborescence protégée par son propre layout. */
export type Espace = "ADMIN" | "AGENT" | "CLIENTS";

/**
 * Profil résolu depuis la session.
 *
 * - `CLIENT` : aucune ligne dans comptes_staff, état lu dans
 *   comptes_clients. `EN_ATTENTE_VALIDATION` → `/pending` et aucun espace :
 *   le compte ne peut rien faire (S1-01). `REFUSE` → `/pending` (le motif
 *   s'y affichera en S1-03). `REVOQUE` → `/sign-in`, définitif.
 * - `INCONNU` : ligne staff illisible, ou utilisateur auth sans ligne
 *   métier d'aucune sorte. On ne devine pas : ce profil n'ouvre aucune porte.
 */
export type Profil =
  | { type: "ANONYME" }
  | { type: "CLIENT"; etat: EtatClient }
  | { type: "STAFF"; role: RoleStaff; etat: EtatStaff }
  | { type: "INCONNU" };

/**
 * Destination après une connexion réussie (poste du formulaire de connexion
 * et du second facteur). Une seule fonction pour tout l'app : le formulaire,
 * la racine et les gardes partagent la même décision.
 */
export function destinationApresConnexion(profil: Profil): string {
  switch (profil.type) {
    case "CLIENT":
      // La barrière S1-01 : un compte non validé ne franchit jamais /clients.
      if (profil.etat === "VALIDE") return DESTINATION_CLIENTS;
      if (profil.etat === "REVOQUE") return DESTINATION_CONNEXION;
      return DESTINATION_ATTENTE;
    case "STAFF":
      if (profil.etat !== "VALIDE") return DESTINATION_CONNEXION;
      return profil.role === "AGENT" ? DESTINATION_AGENT : DESTINATION_ADMIN;
    case "ANONYME":
    case "INCONNU":
      return DESTINATION_CONNEXION;
  }
}

/** L'espace auquel le profil a droit, ou `null` s'il n'a le droit nulle part. */
function espaceDuProfil(profil: Profil): Espace | null {
  if (profil.type === "STAFF" && profil.etat === "VALIDE") {
    return profil.role === "AGENT" ? "AGENT" : "ADMIN";
  }
  if (profil.type === "CLIENT") {
    // Seul un compte validé entre dans l'espace CLIENTS. Un compte en
    // attente ou refusé n'a droit nulle part : la garde le renvoie vers
    // /pending via destinationApresConnexion — jamais de boucle, /pending
    // n'est pas un espace gardé.
    return profil.etat === "VALIDE" ? "CLIENTS" : null;
  }
  return null;
}

/**
 * Garde d'accès : `null` = accès autorisé, sinon la destination imposée.
 *
 * Le confort (où atterrit-on après connexion) ne protège rien : c'est cette
 * fonction, appelée par les layouts serveur, qui empêche un client d'ouvrir
 * `/admin` en tapant l'URL, un agent d'entrer chez les administrateurs, et
 * un staff révoqué d'entrer quelque part que ce soit.
 */
export function redirectionAcces(profil: Profil, espace: Espace): string | null {
  return espaceDuProfil(profil) === espace
    ? null
    : destinationApresConnexion(profil);
}
