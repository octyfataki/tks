import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import ErreurSegment from "./error";
import ErreurGlobale from "./global-error";

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...reste }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...reste}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("frontière d'erreur de segment", () => {
  it("journalise l'erreur et propose de réessayer", () => {
    const journal = vi.spyOn(console, "error").mockImplementation(() => {});
    const reessayer = vi.fn();
    const erreur = new Error("panne");

    render(<ErreurSegment error={erreur} retry={reessayer} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Quelque chose s'est mal passé" }),
    ).toBeInTheDocument();
    expect(journal).toHaveBeenCalledWith(erreur);

    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(reessayer).toHaveBeenCalledTimes(1);
  });

  it("accepte reset quand retry est absent et affiche la référence", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    const erreur = Object.assign(new Error("panne"), { digest: "abc123" });

    render(<ErreurSegment error={erreur} reset={reset} />);

    expect(screen.getByText(/Référence : abc123/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("frontière d'erreur globale", () => {
  it("rend ses propres balises html et body en français", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const balisage = renderToStaticMarkup(
      <ErreurGlobale error={new Error("panne racine")} retry={() => {}} />,
    );

    expect(balisage).toContain("<html");
    expect(balisage).toContain('lang="fr"');
    expect(balisage).toContain("<body");
    expect(balisage).toContain("Quelque chose s&#x27;est mal passé");
  });

  it("relance via retry", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();

    render(<ErreurGlobale error={new Error("panne racine")} retry={retry} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Quelque chose s'est mal passé" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
