import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PasswordInput } from "./password-input";

// La bascule œil ne fait que changer le type du champ et son libellé :
// aucun déplacement au clic (régression : l'effet d'enfoncement du bouton
// générique écrasait le centrage vertical).
describe("PasswordInput", () => {
  it("bascule entre masqué et visible au clic", () => {
    const { container } = render(
      <PasswordInput id="mot-de-passe" name="password" required />,
    );
    const champ = () =>
      container.querySelector("#mot-de-passe") as HTMLInputElement;
    expect(champ()).toHaveAttribute("type", "password");

    fireEvent.click(
      screen.getByRole("button", { name: "Afficher le mot de passe" }),
    );
    expect(champ()).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Masquer le mot de passe" }),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(
      screen.getByRole("button", { name: "Masquer le mot de passe" }),
    );
    expect(champ()).toHaveAttribute("type", "password");
  });

  it("garde le centrage vertical à l'état actif (pas de saut au clic)", () => {
    render(<PasswordInput id="mot-de-passe" name="password" />);
    const bouton = screen.getByRole("button", {
      name: "Afficher le mot de passe",
    });
    // tailwind-merge résout les conflits en faveur de ces classes : le
    // centrage survit à l'état actif, sans transition.
    expect(bouton.className).toMatch(/-translate-y-1\/2/);
    expect(bouton.className).toMatch(/active:-translate-y-1\/2/);
    expect(bouton.className).toMatch(/transition-none/);
  });
});
