import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { getSession } from "@/lib/auth-client";
import { GardienSession } from "./gardien-session";

// Le réseau et la navigation sont neutralisés : on vérifie la décision
// (rediriger ou non), pas better-auth ni Next.
vi.mock("@/lib/auth-client", () => ({
  getSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

const pousser = vi.fn();
const rafraichir = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pousser, refresh: rafraichir }),
}));

// Session morte sans déconnexion (expiration, révocation, autre onglet) :
// l'espace doit renvoyer vers /sign-in au lieu de rester affiché.
// Hors-ligne (requête rejetée) : aucun verdict, aucune redirection.
describe("GardienSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("ne redirige pas quand la session existe", async () => {
    vi.mocked(getSession).mockResolvedValue({ data: { session: { id: "s1" } } } as never);
    await act(async () => {
      render(<GardienSession />);
    });
    expect(pousser).not.toHaveBeenCalled();
  });

  it("renvoie vers /sign-in quand la session a disparu", async () => {
    vi.mocked(getSession).mockResolvedValue({ data: null } as never);
    await act(async () => {
      render(<GardienSession />);
    });
    expect(pousser).toHaveBeenCalledWith("/sign-in");
    expect(rafraichir).toHaveBeenCalled();
  });

  it("ne conclut rien hors-ligne (requête rejetée)", async () => {
    vi.mocked(getSession).mockRejectedValue(new TypeError("panne réseau"));
    await act(async () => {
      render(<GardienSession />);
    });
    expect(pousser).not.toHaveBeenCalled();
  });

  it("revérifie au retour d'onglet et redirige si la session est morte entre-temps", async () => {
    vi.mocked(getSession).mockResolvedValue({ data: { session: { id: "s1" } } } as never);
    await act(async () => {
      render(<GardienSession />);
    });
    expect(pousser).not.toHaveBeenCalled();

    vi.mocked(getSession).mockResolvedValue({ data: null } as never);
    await act(async () => {
      fireEvent(window, new Event("focus"));
    });
    expect(pousser).toHaveBeenCalledWith("/sign-in");
  });

  it("ne redirige qu'une fois quand la session reste morte", async () => {
    vi.mocked(getSession).mockResolvedValue({ data: { session: { id: "s1" } } } as never);
    await act(async () => {
      render(<GardienSession />);
    });
    expect(pousser).not.toHaveBeenCalled();

    vi.mocked(getSession).mockResolvedValue({ data: null } as never);
    await act(async () => {
      fireEvent(window, new Event("focus"));
    });
    expect(pousser).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent(window, new Event("focus"));
    });
    expect(pousser).toHaveBeenCalledTimes(1);
  });
});
