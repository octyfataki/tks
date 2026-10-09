import { describe, expect, it, vi, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { demanderDestination } from "@/lib/destination-connexion";
import { RedirigerConnecte } from "./rediriger-connecte";

vi.mock("@/lib/destination-connexion", () => ({
  demanderDestination: vi.fn(),
}));

const pousser = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pousser, refresh: vi.fn() }),
  usePathname: () => "/sign-up",
}));

// Miroir du GardienSession pour les pages publiques : déjà connecté → son
// espace ; INCONNU (anonyme, réseau coupé) → on reste, sans verdict.
describe("RedirigerConnecte", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renvoie un compte connecté vers son espace", async () => {
    vi.mocked(demanderDestination).mockResolvedValue({
      destination: "/admin",
      code: "OK",
    });
    await act(async () => {
      render(<RedirigerConnecte />);
    });
    expect(pousser).toHaveBeenCalledWith("/admin");
  });

  it("reste sur place quand anonyme ou réseau coupé", async () => {
    vi.mocked(demanderDestination).mockResolvedValue({
      destination: "/sign-in",
      code: "INCONNU",
    });
    await act(async () => {
      render(<RedirigerConnecte />);
    });
    expect(pousser).not.toHaveBeenCalled();
  });

  it("ne reboucle pas quand la destination est la page courante", async () => {
    vi.mocked(demanderDestination).mockResolvedValue({
      destination: "/sign-up",
      code: "OK",
    });
    await act(async () => {
      render(<RedirigerConnecte />);
    });
    expect(pousser).not.toHaveBeenCalled();
  });
});
