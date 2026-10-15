import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { authClient } from "@/lib/auth-client";
import { demanderDestination } from "@/lib/destination-connexion";
import { toast } from "@/components/ui/toast";
import { Verify2faForm } from "./verify-2fa-form";

vi.mock("@/lib/auth-client", () => ({
  authClient: { twoFactor: { verifyOtp: vi.fn() } },
}));

vi.mock("@/lib/destination-connexion", () => ({
  demanderDestination: vi.fn(),
}));

const pousser = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pousser, refresh: vi.fn() }),
}));

function simulerEnvoiOk(methode: string = "sms") {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ status: true, methode }),
  } as never);
}

describe("Verify2faForm — délai anti-renvoi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn());
    simulerEnvoiOk();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("verrouille le renvoi 60 secondes après un envoi, puis le rouvre", async () => {
    render(<Verify2faForm />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Recevoir le code" }),
      );
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    const verrou = screen.getByRole("button", { name: "Renvoyer dans 60 s" });
    expect(verrou).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(
      screen.getByRole("button", { name: "Renvoyer dans 59 s" }),
    ).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(59_000);
    });
    expect(
      screen.getByRole("button", { name: "Renvoyer le code" }),
    ).toBeEnabled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("ne démarre aucun minuteur quand l'envoi échoue", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ code: "ENVOI_REFUSE" }),
    } as never);
    render(<Verify2faForm />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Recevoir le code" }),
      );
    });

    expect(
      screen.getByRole("button", { name: "Recevoir le code" }),
    ).toBeEnabled();
  });
});

describe("Verify2faForm — méthode d'envoi demandée", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("envoie par SMS par défaut et l'annonce", async () => {
    simulerEnvoiOk("sms");
    render(<Verify2faForm />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Recevoir le code" }),
      );
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/2fa/envoyer-code",
      expect.objectContaining({ body: JSON.stringify({ methode: "sms" }) }),
    );
    expect(
      screen.getByText("Code envoyé par SMS. Saisissez celui que vous avez reçu."),
    ).toBeDefined();
  });

  it("envoie par email quand l'onglet email est choisi, et l'annonce", async () => {
    simulerEnvoiOk("email");
    render(<Verify2faForm />);

    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Email" }));
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Recevoir le code" }),
      );
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/2fa/envoyer-code",
      expect.objectContaining({ body: JSON.stringify({ methode: "email" }) }),
    );
    expect(
      screen.getByText("Code envoyé par email. Saisissez celui que vous avez reçu."),
    ).toBeDefined();
  });

  it("redirige vers /sign-in quand le défi a expiré", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: "INVALID_TWO_FACTOR_COOKIE" }),
    } as never);
    render(<Verify2faForm />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Recevoir le code" }),
      );
    });

    expect(pousser).toHaveBeenCalledWith("/sign-in");
    expect(
      screen.getByRole("button", { name: "Recevoir le code" }),
    ).toBeEnabled();
  });
});

describe("Verify2faForm — connexion réussie", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("affiche « Connexion réussie » puis redirige après un code valide", async () => {
    vi.mocked(authClient.twoFactor.verifyOtp).mockResolvedValue({
      data: { token: "session" },
      error: null,
    } as never);
    vi.mocked(demanderDestination).mockResolvedValue({
      destination: "/admin",
      code: "OK",
    });
    const ajouter = vi.spyOn(toast, "add");
    render(<Verify2faForm />);

    fireEvent.change(screen.getByPlaceholderText("6 chiffres"), {
      target: { value: "123456" },
    });
    await act(async () => {
      const champ = screen.getByPlaceholderText("6 chiffres");
      const formulaire = champ.closest("form");
      if (!formulaire) throw new Error("formulaire introuvable");
      fireEvent.submit(formulaire);
    });

    expect(ajouter).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Connexion réussie" }),
    );
    expect(pousser).toHaveBeenCalledWith("/admin");
  });
});
