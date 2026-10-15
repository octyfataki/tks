import type {
  EtatClient,
  EtatStaff,
  RoleStaff,
} from "@/lib/db/schema/s1-comptes";

export const DESTINATION_ADMIN = "/admin";
export const DESTINATION_AGENT = "/agent";
export const DESTINATION_CLIENTS = "/clients";
export const DESTINATION_ATTENTE = "/pending";
export const DESTINATION_CONNEXION = "/sign-in";

export type Espace = "ADMIN" | "AGENT" | "CLIENTS";

export type Profil =
  | { type: "ANONYME" }
  | { type: "CLIENT"; etat: EtatClient }
  | { type: "STAFF"; role: RoleStaff; etat: EtatStaff }
  | { type: "INCONNU" };

export function destinationApresConnexion(profil: Profil): string {
  switch (profil.type) {
    case "CLIENT":
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

function espaceDuProfil(profil: Profil): Espace | null {
  if (profil.type === "STAFF" && profil.etat === "VALIDE") {
    return profil.role === "AGENT" ? "AGENT" : "ADMIN";
  }
  if (profil.type === "CLIENT") {
    return profil.etat === "VALIDE" ? "CLIENTS" : null;
  }
  return null;
}

export function redirectionAcces(profil: Profil, espace: Espace): string | null {
  return espaceDuProfil(profil) === espace
    ? null
    : destinationApresConnexion(profil);
}
