import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Introuvable, { metadata } from "./not-found";

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...reste }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...reste}>
      {children}
    </a>
  ),
}));

describe("page introuvable", () => {
  it("porte un titre de métadonnées explicite", () => {
    expect(metadata.title).toContain("introuvable");
  });

  it("propose le retour à l'accueil et l'aide, sans jargon Excel", () => {
    render(<Introuvable />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Cette page n'existe pas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour à l'accueil" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Voir l'aide" })).toHaveAttribute(
      "href",
      "/aide",
    );

    const corps = document.body.textContent ?? "";
    expect(corps).toContain("créances");
    expect(corps.toLowerCase()).not.toContain("shop");
    expect(corps.toLowerCase()).not.toContain("réalisation");
  });
});
