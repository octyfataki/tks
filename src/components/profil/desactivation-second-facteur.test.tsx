import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { authClient } from "@/lib/auth-client";
import { DesactivationSecondFacteur } from "./desactivation-second-facteur";
import { desactiverSecondFacteurAction } from "@/app/admin/profil/actions";

vi.mock("@/lib/auth-client", () => ({
  authClient: { twoFactor: { disable: vi.fn() } },
}));

vi.mock("@/app/admin/profil/actions", () => ({
  desactiverSecondFacteurAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function ouvrir() {
  render(<DesactivationSecondFacteur />);
  fireEvent.click(screen.getByRole("button", { name: "Désactiver le second facteur" }));
}

function motDePasse(valeur: string) {
  fireEvent.change(screen.getByLabelText("Confirmez votre mot de passe"), {
    target: { value: valeur },
  });
}

async function confirmer() {
  const formulaire = screen.getByLabelText("Confirmer la désactivation").closest("form");
  if (!formulaire) throw new Error("formulaire introuvable");
  await act(async () => {
    fireEvent.submit(formulaire);
  });
}

// Issue #5 : le second facteur est optionnel pour tous, donc désactivable
// par le titulaire lui-même depuis sa page profil, au mot de passe.
describe("DesactivationSecondFacteur", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exige toujours le mot de passe avant la désactivation", async () => {
    ouvrir();
    await confirmer();
    expect(screen.getByRole("alert")).toHaveTextContent(/mot de passe est exigé/i);
    expect(authClient.twoFactor.disable).not.toHaveBeenCalled();
  });

  it("désactive puis marque la traçabilité inactive", async () => {
    vi.mocked(authClient.twoFactor.disable).mockResolvedValue({ error: null } as never);
    vi.mocked(desactiverSecondFacteurAction).mockResolvedValue({ ok: true } as never);
    ouvrir();
    motDePasse("mot-de-passe-sûr");
    await confirmer();
    expect(authClient.twoFactor.disable).toHaveBeenCalledWith({ password: "mot-de-passe-sûr" });
    expect(desactiverSecondFacteurAction).toHaveBeenCalled();
    expect(screen.getByLabelText("Second facteur désactivé")).toBeInTheDocument();
  });

  it("traduit un mot de passe incorrect sans appeler la traçabilité", async () => {
    vi.mocked(authClient.twoFactor.disable).mockResolvedValue({
      error: { code: "INVALID_PASSWORD", message: "Invalid password" },
    } as never);
    ouvrir();
    motDePasse("mauvais-mot-de-passe");
    await confirmer();
    expect(screen.getByRole("alert")).toHaveTextContent(/mot de passe incorrect/i);
    expect(desactiverSecondFacteurAction).not.toHaveBeenCalled();
  });
});
