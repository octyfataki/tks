import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LegalNoticePage from "@/app/(public)/legal-notice/page";

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

describe("page mentions légales", () => {
  it("porte son titre et son introduction", () => {
    render(<LegalNoticePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Mentions légales" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Éditeur du service" }),
    ).toBeInTheDocument();
  });

  it("nomme l'éditeur, l'hébergeur et le contact", () => {
    render(<LegalNoticePage />);
    expect(
      screen.getByRole("heading", { name: "Éditeur du service" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Hébergeur" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/contact@tks.cd/)).toBeInTheDocument();
    expect(
      screen.getAllByText(/à compléter : raison sociale/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("revient à l'accueil par le logo", () => {
    render(<LegalNoticePage />);
    expect(
      screen.getByRole("link", { name: "TKS — accueil" }).getAttribute("href"),
    ).toBe("/");
  });
});
