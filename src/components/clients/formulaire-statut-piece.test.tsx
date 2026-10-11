import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FormulaireStatutPiece } from "./formulaire-statut-piece";
import { statuerPieceIdentiteAction } from "./actions";

vi.mock("./actions", () => ({
  statuerPieceIdentiteAction: vi.fn(() => Promise.resolve({ ok: true })),
}));

// Verdict sur une pièce d'un compte déjà validé : le compte n'est jamais
// touché, seul le document l'est. Le refus porte un motif obligatoire.
describe("FormulaireStatutPiece", () => {
  it("propose d'accepter la pièce", () => {
    render(<FormulaireStatutPiece compteId="c1" pieceId="p1" />);
    expect(
      screen.getByRole("button", { name: /accepter cette pièce/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/le compte reste validé/i),
    ).toBeInTheDocument();
  });

  it("n'ouvre le motif du refus qu'au clic", () => {
    render(<FormulaireStatutPiece compteId="c1" pieceId="p1" />);
    expect(screen.queryByLabelText(/ce que le client doit corriger/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^refuser$/i }));
    const motif = screen.getByLabelText(/ce que le client doit corriger/i);
    expect(motif).toBeRequired();
    expect(motif).toHaveAttribute("minlength", "3");
    expect(motif).toHaveAttribute("maxlength", "500");
  });

  it("replie le refus sans abandonner le compte", () => {
    render(<FormulaireStatutPiece compteId="c1" pieceId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: /^refuser$/i }));
    fireEvent.click(screen.getByRole("button", { name: /annuler/i }));
    expect(screen.queryByLabelText(/ce que le client doit corriger/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: /accepter cette pièce/i }),
    ).toBeInTheDocument();
  });

  it("n'emploie aucun terme interdit du glossaire", () => {
    const { container } = render(
      <FormulaireStatutPiece compteId="c1" pieceId="p1" />,
    );
    const texte = (container.textContent ?? "").toLowerCase();
    for (const interdit of ["shop", "réalisation", "realisation", "vente", "e-money", "virtuel"]) {
      expect(texte).not.toContain(interdit);
    }
    expect(vi.isMockFunction(statuerPieceIdentiteAction)).toBe(true);
  });
});