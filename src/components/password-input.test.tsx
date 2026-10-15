import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PasswordInput } from "./password-input";

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

  it("ne bouge pas au clic : bouton natif, centrage intact, sans translate actif", () => {
    render(<PasswordInput id="mot-de-passe" name="password" />);
    const bouton = screen.getByRole("button", {
      name: "Afficher le mot de passe",
    });
    expect(bouton.tagName).toBe("BUTTON");
    expect(bouton.getAttribute("data-slot")).toBeNull();
    expect(bouton.className).toMatch(/-translate-y-1\/2/);
    expect(bouton.className).not.toMatch(/active:translate/);
  });
});
