import { describe, expect, it } from "vitest";
import {
  destinationApresConnexion,
  redirectionAcces,
  type Profil,
} from "./role-session";

const admin: Profil = { type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" };
const tech: Profil = { type: "STAFF", role: "ADMIN_TECHNIQUE", etat: "VALIDE" };
const agent: Profil = { type: "STAFF", role: "AGENT", etat: "VALIDE" };
const adminRevoque: Profil = { type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "REVOQUE" };
const agentRevoque: Profil = { type: "STAFF", role: "AGENT", etat: "REVOQUE" };
const adminSuspendu: Profil = { type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "SUSPENDU" };
const agentSuspendu: Profil = { type: "STAFF", role: "AGENT", etat: "SUSPENDU" };
const client: Profil = { type: "CLIENT" };
const anonyme: Profil = { type: "ANONYME" };
const inconnu: Profil = { type: "INCONNU" };

describe("destinationApresConnexion", () => {
  const cas: Array<[string, Profil, string]> = [
    ["administrateur principal", admin, "/admin"],
    ["administrateur technique", tech, "/admin"],
    ["agent de service", agent, "/agent"],
    ["client", client, "/clients"],
    ["anonyme", anonyme, "/sign-in"],
    ["profil illisible", inconnu, "/sign-in"],
    ["administrateur révoqué", adminRevoque, "/sign-in"],
    ["agent révoqué", agentRevoque, "/sign-in"],
    ["administrateur suspendu", adminSuspendu, "/sign-in"],
    ["agent suspendu", agentSuspendu, "/sign-in"],
  ];

  it.each(cas)("renvoie %s vers la bonne destination", (_label, profil, attendu) => {
    expect(destinationApresConnexion(profil)).toBe(attendu);
  });
});

describe("redirectionAcces", () => {
  const autorises: Array<[string, Profil, "ADMIN" | "AGENT" | "CLIENTS"]> = [
    ["l'administrateur principal", admin, "ADMIN"],
    ["l'administrateur technique", tech, "ADMIN"],
    ["l'agent de service", agent, "AGENT"],
    ["le client", client, "CLIENTS"],
  ];

  it.each(autorises)("laisse entrer %s dans son espace", (_label, profil, espace) => {
    expect(redirectionAcces(profil, espace)).toBeNull();
  });

  const refus: Array<[string, Profil, "ADMIN" | "AGENT" | "CLIENTS", string]> = [
    ["un client force /admin", client, "ADMIN", "/clients"],
    ["un client force /agent", client, "AGENT", "/clients"],
    ["un agent entre chez les administrateurs", agent, "ADMIN", "/agent"],
    ["un administrateur entre chez les agents", admin, "AGENT", "/admin"],
    ["un administrateur entre chez les clients", admin, "CLIENTS", "/admin"],
    ["un agent entre chez les clients", agent, "CLIENTS", "/agent"],
    ["un anonyme ouvre /admin", anonyme, "ADMIN", "/sign-in"],
    ["un anonyme ouvre /clients", anonyme, "CLIENTS", "/sign-in"],
    ["un administrateur révoqué ouvre /admin", adminRevoque, "ADMIN", "/sign-in"],
    ["un agent révoqué ouvre /agent", agentRevoque, "AGENT", "/sign-in"],
    ["un administrateur suspendu ouvre /admin", adminSuspendu, "ADMIN", "/sign-in"],
    ["un agent suspendu ouvre /agent", agentSuspendu, "AGENT", "/sign-in"],
    ["un profil illisible ouvre /admin", inconnu, "ADMIN", "/sign-in"],
  ];

  it.each(refus)(
    "renvoie %s vers %s",
    (_label, profil, espace, attendu) => {
      expect(redirectionAcces(profil, espace)).toBe(attendu);
    },
  );

  it("ne crée jamais de boucle de redirection", () => {
    // Le renvoi pointe toujours vers l'espace propre au profil : la garde de
    // cette destination-là laisse donc entrer.
    for (const profil of [admin, tech, agent, client, anonyme, inconnu, adminRevoque]) {
      for (const espace of ["ADMIN", "AGENT", "CLIENTS"] as const) {
        const destination = redirectionAcces(profil, espace);
        if (destination === null) continue;
        const espaceVise = destination === "/admin" ? "ADMIN"
          : destination === "/agent" ? "AGENT"
          : destination === "/clients" ? "CLIENTS"
          : null;
        if (espaceVise === null) continue; // /sign-in n'est pas un espace gardé
        expect(redirectionAcces(profil, espaceVise)).toBeNull();
      }
    }
  });
});
