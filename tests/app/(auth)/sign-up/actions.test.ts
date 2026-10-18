import { beforeEach, describe, expect, it, vi } from "vitest";
import { inscrireCompteClient } from "@/app/(auth)/sign-up/actions";
import { ClientError, inscrireClient } from "@/lib/accounts/clients";
import { auth } from "@/lib/auth";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/accounts/clients", () => ({
  inscrireClient: vi.fn(async () => ({
    id: "compte-1",
    betterAuthUserId: "user-1",
  })),
  ClientError: class ClientError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { signInEmail: vi.fn(async () => ({ token: "cookie" })) } },
}));

const VALIDE = {
  email: "Client@Example.cd",
  password: "motdepasse123",
  name: "Client Test",
  telephone: "0900000001",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("inscription client", () => {
  it("ouvre une session pour le compte fraîchement créé", async () => {
    const resultat = await inscrireCompteClient(VALIDE);

    expect(inscrireClient).toHaveBeenCalledTimes(1);
    expect(auth.api.signInEmail).toHaveBeenCalledTimes(1);
    expect(auth.api.signInEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { email: "client@example.cd", password: VALIDE.password },
      }),
    );
    expect(resultat).toEqual({ ok: true, session: true });
  });

  it("garde le compte créé même si la session ne s'ouvre pas", async () => {
    vi.mocked(auth.api.signInEmail).mockRejectedValueOnce(
      new Error("cookie refusé"),
    );

    const resultat = await inscrireCompteClient(VALIDE);

    expect(inscrireClient).toHaveBeenCalledTimes(1);
    expect(resultat).toEqual({ ok: true, session: false });
  });

  it("n'essaie pas d'ouvrir de session quand le compte n'est pas créé", async () => {
    vi.mocked(inscrireClient).mockRejectedValueOnce(
      new ClientError("TELEPHONE_DEJA_UTILISE", "déjà utilisé"),
    );

    const resultat = await inscrireCompteClient(VALIDE);

    expect(auth.api.signInEmail).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      ok: false,
      erreur: "un compte existe déjà avec ce numéro",
    });
  });

  it("refuse avant tout appel si les données sont invalides", async () => {
    const resultat = await inscrireCompteClient({ ...VALIDE, password: "court" });

    expect(inscrireClient).not.toHaveBeenCalled();
    expect(auth.api.signInEmail).not.toHaveBeenCalled();
    expect(resultat.ok).toBe(false);
  });
});