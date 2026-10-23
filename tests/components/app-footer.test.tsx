import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppFooter } from "@/components/app-footer";
import { APP_VERSION } from "@/lib/app-version";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...reste }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...reste}>
      {children}
    </a>
  ),
}));

function linkTo(name: string | RegExp): HTMLAnchorElement {
  return screen.getByRole("link", { name }) as HTMLAnchorElement;
}

describe("pied de page", () => {
  it("est une balise de pied de page sémantique", () => {
    render(<AppFooter />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("propose la connexion et l'inscription", () => {
    render(<AppFooter />);
    expect(linkTo("Connexion").getAttribute("href")).toBe("/sign-in");
    expect(linkTo("Créer un compte client").getAttribute("href")).toBe(
      "/sign-up",
    );
  });

  it("propose les pages légales", () => {
    render(<AppFooter />);
    expect(linkTo("Mentions légales").getAttribute("href")).toBe(
      "/legal-notice",
    );
    expect(linkTo("Confidentialité").getAttribute("href")).toBe("/privacy");
  });

  it("donne un contact cliquable", () => {
    render(<AppFooter />);
    expect(linkTo("contact@tks.cd").getAttribute("href")).toBe(
      "mailto:contact@tks.cd",
    );
    expect(screen.getByText("Kinshasa, RDC")).toBeInTheDocument();
  });

  it("affiche la version de l'application", () => {
    render(<AppFooter />);
    expect(screen.getByText(`version ${APP_VERSION}`)).toBeInTheDocument();
  });

  it("ne renvoie pas vers une aide inaccessible", () => {
    render(<AppFooter />);
    expect(screen.queryByRole("link", { name: "Aide" })).toBeNull();
  });
});
