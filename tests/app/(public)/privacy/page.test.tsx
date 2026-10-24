import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "@/app/(public)/privacy/page";

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

describe("page confidentialité", () => {
  it("porte son titre et son introduction", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Confidentialité" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Données collectées" }),
    ).toBeInTheDocument();
  });

  it("liste les finalités et la conservation hors ligne", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { name: "Finalités" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/conservée localement sur l'appareil/i),
    ).toBeInTheDocument();
  });

  it("donne les droits et le contact", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { name: "Vos droits" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/contact@tks.cd/).length).toBeGreaterThanOrEqual(1);
  });
});
