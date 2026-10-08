import { afterEach, describe, expect, it, vi } from "vitest";
import { demanderDestination } from "./destination-connexion";

function reponse(corps: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => corps } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("demanderDestination", () => {
  it("retourne la destination servie", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reponse({ destination: "/admin", code: "OK" })));
    await expect(demanderDestination()).resolves.toEqual({
      destination: "/admin",
      code: "OK",
    });
  });

  it("propage le motif de révocation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reponse({ destination: "/sign-in", code: "REVOQUE" })));
    await expect(demanderDestination()).resolves.toEqual({
      destination: "/sign-in",
      code: "REVOQUE",
    });
  });

  it("propage le motif de suspension", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reponse({ destination: "/sign-in", code: "SUSPENDU" })));
    await expect(demanderDestination()).resolves.toEqual({
      destination: "/sign-in",
      code: "SUSPENDU",
    });
  });

  it("replie sur le login quand le réseau tombe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(demanderDestination()).resolves.toEqual({
      destination: "/sign-in",
      code: "INCONNU",
    });
  });

  it("replie sur le login quand la réponse est en erreur", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reponse({}, false, 500)));
    await expect(demanderDestination()).resolves.toEqual({
      destination: "/sign-in",
      code: "INCONNU",
    });
  });

  it("refuse une destination qui n'est pas un chemin interne", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reponse({ destination: "https://evil.example", code: "OK" })));
    await expect(demanderDestination()).resolves.toEqual({
      destination: "/sign-in",
      code: "INCONNU",
    });
  });
});
