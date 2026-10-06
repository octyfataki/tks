import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
}));

describe("page d'accueil", () => {
  it("affiche le message de démarrage", () => {
    render(<Home />);
    expect(screen.getByText(/to get started/i)).toBeInTheDocument();
  });
});
