import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { authClient } from "@/lib/auth-client";
import { Verify2faForm } from "./verify-2fa-form";

// Le client réseau est neutralisé : on vérifie le minuteur, pas l'envoi.
vi.mock("@/lib/auth-client", () => ({
  authClient: { twoFactor: { sendOtp: vi.fn(), verifyOtp: vi.fn() } },
}));

// Hors App Router, `useRouter` lève : on le remplace par un poussoir inerte.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Garantie anti-martèlement : après un envoi, le bouton se verrouille 60 s
// avec compte à rebours visible, puis se rouvre. La garde serveur
// (3 envois/minute, src/lib/auth.ts) reste l'autorité ; ici on teste le
// retour visible qui empêche les clics répétés.
describe("Verify2faForm — délai anti-renvoi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(authClient.twoFactor.sendOtp).mockResolvedValue({
      data: { status: true },
      error: null,
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("verrouille le renvoi 60 secondes après un envoi, puis le rouvre", async () => {
    render(<Verify2faForm />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Recevoir le code" }),
      );
    });
    expect(authClient.twoFactor.sendOtp).toHaveBeenCalledTimes(1);

    // Bouton verrouillé avec compte à rebours, pas réutilisable.
    const verrou = screen.getByRole("button", { name: "Renvoyer dans 60 s" });
    expect(verrou).toBeDisabled();

    // Le compteur décrémente chaque seconde.
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(
      screen.getByRole("button", { name: "Renvoyer dans 59 s" }),
    ).toBeDisabled();

    // Au bout des 60 s, le renvoi se rouvre.
    await act(async () => {
      vi.advanceTimersByTime(59_000);
    });
    expect(
      screen.getByRole("button", { name: "Renvoyer le code" }),
    ).toBeEnabled();
    // Un seul appel réseau malgré l'attente : rien n'est reparti tout seul.
    expect(authClient.twoFactor.sendOtp).toHaveBeenCalledTimes(1);
  });

  it("ne démarre aucun minuteur quand l'envoi échoue", async () => {
    vi.mocked(authClient.twoFactor.sendOtp).mockResolvedValue({
      data: null,
      error: { code: "FAILED_TO_SEND_OTP" },
    } as never);
    render(<Verify2faForm />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Recevoir le code" }),
      );
    });

    // Pas de compte à rebours : l'utilisateur peut réessayer aussitôt.
    expect(
      screen.getByRole("button", { name: "Recevoir le code" }),
    ).toBeEnabled();
  });
});
