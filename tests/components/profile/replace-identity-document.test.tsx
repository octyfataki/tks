import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RemplacerPieceIdentite } from "@/components/profile/replace-identity-document";

vi.mock("@/app/(auth)/pending/upload-actions", () => ({
  deposerPieceIdentiteAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("RemplacerPieceIdentite", () => {
  it("déplie le formulaire de remplacement au clic", () => {
    render(<RemplacerPieceIdentite />);
    expect(
      screen.getByRole("button", { name: /remplacer ma pièce/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /envoyer la nouvelle pièce/i }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /remplacer ma pièce/i }),
    );
    expect(screen.getByText("Remplacez votre pièce")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /envoyer la nouvelle pièce/i }),
    ).toBeDisabled();
    expect(screen.queryByText(/pièces déjà déposées/i)).toBeNull();
  });
});
