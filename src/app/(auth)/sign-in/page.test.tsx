import { describe, expect, it, vi } from "vitest";
import SignInPage from "./page";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import type { Profil } from "@/lib/s1-comptes/role-session";

vi.mock("@/lib/s1-comptes/profil-session", () => ({
  profilSession: vi.fn(),
}));

/** next/navigation#redirect lance une erreur dont le digest porte l'URL. */
async function destinationDe(profil: Profil): Promise<string> {
  vi.mocked(profilSession).mockResolvedValueOnce(profil);
  const erreur = await SignInPage().catch((e: unknown) => e);
  expect(erreur).toBeInstanceOf(Error);
  return (erreur as Error & { digest?: string }).digest ?? "";
}

// Déjà connecté → son espace. INCONNU reste sur place : rediriger vers
// /sign-in depuis /sign-in bouclerait.
describe("page sign-in", () => {
  it("renvoie un administrateur connecté vers son espace", async () => {
    expect(
      await destinationDe({
        type: "STAFF",
        role: "ADMIN_PRINCIPAL",
        etat: "VALIDE",
      }),
    ).toContain("/admin");
  });

  it("laisse passer un anonyme", async () => {
    vi.mocked(profilSession).mockResolvedValueOnce({ type: "ANONYME" });
    await expect(SignInPage()).resolves.toBeDefined();
  });

  it("ne boucle pas sur un profil INCONNU", async () => {
    vi.mocked(profilSession).mockResolvedValueOnce({ type: "INCONNU" });
    await expect(SignInPage()).resolves.toBeDefined();
  });
});
