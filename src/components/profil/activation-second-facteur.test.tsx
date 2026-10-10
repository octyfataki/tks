import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { authClient } from "@/lib/auth-client";
import { ActivationSecondFacteur } from "./activation-second-facteur";

vi.mock("@/lib/auth-client", () => ({
  authClient: { twoFactor: { enable: vi.fn(), sendOtp: vi.fn(), verifyOtp: vi.fn() } },
}));

vi.mock("@/app/admin/profil/actions", () => ({
  confirmerSecondFacteurAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function ouvrir() {
  render(<ActivationSecondFacteur email="aline@example.com" telephone="+243 815 000 000" />);
  fireEvent.click(screen.getByRole("button", { name: "Activer le second facteur" }));
}

function motDePasse(valeur: string) {
  fireEvent.change(screen.getByLabelText("Confirmez votre mot de passe"), {
    target: { value: valeur },
  });
}

async function recevoirLeCode() {
  const formulaire = screen.getByLabelText("Choisir la méthode").closest("form");
  if (!formulaire) throw new Error("formulaire introuvable");
  await act(async () => {
    fireEvent.submit(formulaire);
  });
}

// Issue #3 : le second facteur est optionnel pour tous et s'active depuis
// sa page profil, par SMS ou par email. SMS sans numéro = repli email
// explicite, jamais de code perdu ni de blocage.
describe("ActivationSecondFacteur — méthode et repli", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("propose la méthode SMS ou email, jamais le mot « canal »", () => {
    ouvrir();
    expect(screen.getByRole("group", { name: "Méthode du second facteur" })).toBeInTheDocument();
    expect(screen.queryByText(/canal/i)).not.toBeInTheDocument();
  });

  it("envoie le code par SMS quand un numéro est renseigné", async () => {
    vi.mocked(authClient.twoFactor.enable).mockResolvedValue({ error: null } as never);
    vi.mocked(authClient.twoFactor.sendOtp).mockResolvedValue({ error: null } as never);
    ouvrir();
    motDePasse("mot-de-passe-sûr");
    await recevoirLeCode();
    expect(screen.getByLabelText("Code reçu par SMS")).toBeInTheDocument();
  });

  it("replie vers l'email avec un message explicite quand aucun numéro", async () => {
    vi.mocked(authClient.twoFactor.enable).mockResolvedValue({ error: null } as never);
    vi.mocked(authClient.twoFactor.sendOtp).mockResolvedValue({ error: null } as never);
    render(<ActivationSecondFacteur email="aline@example.com" telephone={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Activer le second facteur" }));
    motDePasse("mot-de-passe-sûr");
    await recevoirLeCode();
    // Pas de blocage : l'étape email s'affiche, avec le repli annoncé.
    expect(screen.getByLabelText("Code reçu par email")).toBeInTheDocument();
    expect(screen.getByText(/repli : aucun numéro de contact/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("exige toujours le mot de passe avant l'envoi", async () => {
    ouvrir();
    await recevoirLeCode();
    expect(screen.getByRole("alert")).toHaveTextContent(/mot de passe est exigé/i);
    expect(authClient.twoFactor.enable).not.toHaveBeenCalled();
  });
});
