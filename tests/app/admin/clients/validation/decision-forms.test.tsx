import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  FormulaireAttesterComptoir,
  FormulaireRefuser,
  FormulaireRevoquer,
  FormulaireValider,
} from "@/app/admin/clients/validation/decision-forms";
import { TYPES_PIECE } from "@/lib/accounts/document-files";

vi.mock("@/app/admin/clients/validation/actions", () => ({
  validerCompteClientAction: vi.fn(),
  refuserCompteClientAction: vi.fn(),
  validerCompteClientComptoirAction: vi.fn(),
  revoquerCompteClientAction: vi.fn(),
}));

describe("formulaires de décision", () => {
  it("valide sur la pièce désignée, sans champ à saisir", () => {
    render(<FormulaireValider compteId="c1" pieceId="p1" />);
    expect(
      screen.getByRole("button", { name: /valider sur cette pièce/i }),
    ).toBeInTheDocument();
  });

  it("refuse avec un motif obligatoire", () => {
    render(<FormulaireRefuser compteId="c1" />);
    const motif = screen.getByLabelText(/motif montré au client/i);
    expect(motif.getAttribute("required")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /confirmer le refus/i }),
    ).toBeInTheDocument();
  });

  it("atteste la vue au comptoir avec un type en liste fermée (shadcn)", async () => {
    render(<FormulaireAttesterComptoir compteId="c1" />);
    const declencheur = screen.getByRole("combobox", {
      name: /pièce vue au comptoir/i,
    });
    expect(declencheur).toBeInTheDocument();
    fireEvent.click(declencheur);
    const options = await screen.findAllByRole("option");
    expect(options.map((o) => o.textContent?.trim())).toEqual([
      ...TYPES_PIECE,
    ]);
    expect(
      screen.getByRole("button", { name: /valider au comptoir/i }),
    ).toBeInTheDocument();
  });

  it("révoque le compte suspect avec un motif obligatoire", () => {
    render(<FormulaireRevoquer compteId="c1" />);
    const motif = screen.getByLabelText(/motif de la révocation/i);
    expect(motif.getAttribute("required")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /révoquer définitivement/i }),
    ).toBeInTheDocument();
  });
});
