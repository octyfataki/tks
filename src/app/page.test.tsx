import { describe, expect, it, vi } from "vitest";
import Home from "./page";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import type { Profil } from "@/lib/s1-comptes/role-session";

vi.mock("@/lib/s1-comptes/profil-session", () => ({
  profilSession: vi.fn(),
}));

/** next/navigation#redirect lance une erreur dont le digest porte l'URL. */
async function destinationDe(profil: Profil): Promise<string> {
  vi.mocked(profilSession).mockResolvedValueOnce(profil);
  const erreur = await Home().catch((e: unknown) => e);
  expect(erreur).toBeInstanceOf(Error);
  return (erreur as Error & { digest?: string }).digest ?? "";
}

describe("page d'accueil", () => {
  it("renvoie un anonyme vers le login", async () => {
    expect(await destinationDe({ type: "ANONYME" })).toContain("/sign-in");
  });

  it("atterrit un administrateur dans l'espace admin", async () => {
    expect(
      await destinationDe({ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }),
    ).toContain("/admin");
  });

  it("atterrit un agent de service dans l'espace agent", async () => {
    expect(
      await destinationDe({ type: "STAFF", role: "AGENT", etat: "VALIDE" }),
    ).toContain("/agent");
  });

  it("atterrit un client validé dans l'espace client", async () => {
    expect(
      await destinationDe({ type: "CLIENT", etat: "VALIDE" }),
    ).toContain("/clients");
  });

  it("atterrit un client en attente sur /pending", async () => {
    expect(
      await destinationDe({ type: "CLIENT", etat: "EN_ATTENTE_VALIDATION" }),
    ).toContain("/pending");
  });
});
