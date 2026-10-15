import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BoutonRetirerPiece } from "@/components/profile/remove-document-button";
import { retirerPieceIdentiteAction } from "@/components/clients/actions";

const rafraichir = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: rafraichir }),
}));

vi.mock("@/components/clients/actions", () => ({
  retirerPieceIdentiteAction: vi.fn(),
}));

vi.mock("@/app/(auth)/pending/upload-actions", () => ({
  deposerPieceIdentiteAction: vi.fn(),
}));

// Retirer une pièce est définitif pour le client : rien ne part sans
// qu'il l'ait confirmé explicitement.
describe("BoutonRetirerPiece", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("demande confirmation avant de partir", () => {
    render(<BoutonRetirerPiece pieceId="p1" />);
    expect(
      screen.getByRole("button", { name: /retirer cette pièce/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /confirmer le retrait/i }),
    ).toBeNull();
  });

  it("n'écrit rien tant que la confirmation n'est pas donnée", () => {
    render(<BoutonRetirerPiece pieceId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: /retirer cette pièce/i }));
    expect(
      screen.getByRole("button", { name: /confirmer le retrait/i }),
    ).toBeInTheDocument();
    expect(retirerPieceIdentiteAction).not.toHaveBeenCalled();
  });

  it("envoie la pièce puis recharge la page", async () => {
    vi.mocked(retirerPieceIdentiteAction).mockResolvedValue({
      ok: true,
      compteId: "c1",
    });
    render(<BoutonRetirerPiece pieceId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: /retirer cette pièce/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmer le retrait/i }));
    await waitFor(() => expect(retirerPieceIdentiteAction).toHaveBeenCalled());
    const [, donnees] = vi.mocked(retirerPieceIdentiteAction).mock.calls[0];
    expect(donnees?.get("pieceId")).toBe("p1");
    expect(rafraichir).toHaveBeenCalled();
  });

  it("remonte le refus de l'action sans recharger la page", async () => {
    vi.mocked(retirerPieceIdentiteAction).mockResolvedValue({
      ok: false,
      erreur: "Seule une pièce refusée peut être retirée, et une seule fois.",
    });
    render(<BoutonRetirerPiece pieceId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: /retirer cette pièce/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmer le retrait/i }));
    await waitFor(() =>
      expect(retirerPieceIdentiteAction).toHaveBeenCalled(),
    );
    const alerte = await screen.findByRole("alert");
    expect(alerte).toHaveTextContent(/seule une pièce refusée/i);
    expect(rafraichir).not.toHaveBeenCalled();
  });

  it("peut être annulé", () => {
    render(<BoutonRetirerPiece pieceId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: /retirer cette pièce/i }));
    fireEvent.click(screen.getByRole("button", { name: /annuler/i }));
    expect(
      screen.queryByRole("button", { name: /confirmer le retrait/i }),
    ).toBeNull();
  });

  it("n'emploie aucun terme interdit du glossaire", () => {
    const { container } = render(<BoutonRetirerPiece pieceId="p1" />);
    const texte = (container.textContent ?? "").toLowerCase();
    for (const interdit of ["shop", "réalisation", "realisation", "vente", "e-money", "virtuel"]) {
      expect(texte).not.toContain(interdit);
    }
  });
});