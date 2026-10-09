import { describe, expect, it, vi } from "vitest";
import Verify2faPage from "./page";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { cookies } from "next/headers";
import type { Profil } from "@/lib/s1-comptes/role-session";

vi.mock("@/lib/s1-comptes/profil-session", () => ({
  profilSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const DEFI = "2fa-WKDKhWRH-0hL5VxcDUt9";
const SIGNE = `${DEFI}.${"A".repeat(43)}=`;

function simulerCookies(valeurs: Array<{ name: string; value: string }>) {
  vi.mocked(cookies).mockResolvedValue({
    getAll: () => valeurs,
  } as never);
}

/** next/navigation#redirect lance une erreur dont le digest porte l'URL. */
async function destinationDe(profil: Profil): Promise<string> {
  vi.mocked(profilSession).mockResolvedValueOnce(profil);
  const erreur = await Verify2faPage().catch((e: unknown) => e);
  expect(erreur).toBeInstanceOf(Error);
  return (erreur as Error & { digest?: string }).digest ?? "";
}

// /verify-2fa n'a de sens qu'en plein défi : déjà connecté → son espace,
// anonyme sans défi → /sign-in. Seul le défi en cours reste sur place.
describe("page verify-2fa", () => {
  it("renvoie un administrateur connecté vers son espace", async () => {
    simulerCookies([]);
    expect(
      await destinationDe({
        type: "STAFF",
        role: "ADMIN_PRINCIPAL",
        etat: "VALIDE",
      }),
    ).toContain("/admin");
  });

  it("renvoie un anonyme sans défi vers le login", async () => {
    simulerCookies([]);
    expect(await destinationDe({ type: "ANONYME" })).toContain("/sign-in");
  });

  it("laisse passer un anonyme en plein défi 2FA", async () => {
    vi.mocked(profilSession).mockResolvedValueOnce({ type: "ANONYME" });
    simulerCookies([{ name: "better-auth.two_factor", value: SIGNE }]);
    await expect(Verify2faPage()).resolves.toBeDefined();
  });
});
