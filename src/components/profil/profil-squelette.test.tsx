import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfilSquelette } from "./profil-squelette";

describe("ProfilSquelette", () => {
  it("expose un état de chargement accessible, sans termes interdits", () => {
    const { container } = render(<ProfilSquelette />);
    expect(screen.getByRole("status", { name: "Chargement du compte" })).toBeInTheDocument();
    const texte = (container.textContent ?? "").toLowerCase();
    for (const interdit of ["shop", "réalisation", "realisation", "vente", "e-money", "virtuel"]) {
      expect(texte).not.toContain(interdit);
    }
  });
});
