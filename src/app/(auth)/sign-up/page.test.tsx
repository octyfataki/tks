import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignUpPage from "./page";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// La server action tire db + env (DATABASE_URL) : hors sujet ici, on la coupe.
vi.mock("./actions", () => ({
  inscrireCompteClient: vi.fn().mockResolvedValue({ ok: true }),
}));

/**
 * S1-01 : l'inscription ne fait croire à aucun envoi de pièce. Le second
 * écran dit où déposer (connecté, sur /pending) ou présenter (comptoir),
 * sans champ fichier ni promesse de conservation.
 */
describe("page d'inscription", () => {
  it("ne propose aucun envoi de pièce après la création du compte", async () => {
    render(<SignUpPage />);
    const formulaire = document.querySelector("form");
    expect(formulaire).not.toBeNull();
    fireEvent.submit(formulaire!);
    expect(
      await screen.findByRole("heading", { name: /compte créé/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /voir ma page d'attente/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/pièce d'identité/i),
    ).toBeNull();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });
});
