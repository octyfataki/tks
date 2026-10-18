import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ListePiecesIdentite,
  type PieceIdentiteProfil,
} from "@/components/profile/identity-document-list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/clients/actions", () => ({
  retirerPieceIdentiteAction: vi.fn(),
}));

const pieces: PieceIdentiteProfil[] = [
  {
    id: "piece-image",
    typePiece: "CNI",
    mime: "image/jpeg",
    statutPiece: "ACCEPTEE",
    refusMotif: null,
    deposeLe: new Date("2026-10-02T08:00:00Z"),
  },
  {
    id: "piece-pdf",
    typePiece: "PASSEPORT",
    mime: "application/pdf",
    statutPiece: "EN_ATTENTE",
    refusMotif: null,
    deposeLe: "2026-10-06T08:00:00Z",
  },
  {
    id: "piece-refusee",
    typePiece: "CNI",
    mime: "image/jpeg",
    statutPiece: "REFUSEE",
    refusMotif: "Photo trop floue, envoyez une CNI lisible.",
    deposeLe: "2026-10-08T08:00:00Z",
  },
  {
    id: "piece-retiree",
    typePiece: "CNI",
    mime: "image/jpeg",
    statutPiece: "RETIREE",
    refusMotif: "Photo trop floue, envoyez une CNI lisible.",
    deposeLe: "2026-10-09T08:00:00Z",
  },
];

describe("ListePiecesIdentite", () => {
  it("lie chaque pièce à la route authentifiée du propriétaire", () => {
    render(<ListePiecesIdentite pieces={pieces} />);
    const liens = screen.getAllByRole("link");
    expect(liens).toHaveLength(3);
    expect(liens[0].getAttribute("href")).toBe(
      "/api/client-documents/piece-image",
    );
    expect(liens[0].getAttribute("target")).toBe("_blank");
    expect(liens[1].getAttribute("href")).toBe("/api/client-documents/piece-pdf");
  });

  it("montre la vignette pour une image, l'icône fichier sinon", () => {
    const { container } = render(<ListePiecesIdentite pieces={pieces} />);
    expect(screen.getAllByAltText(/votre pièce/i)).toHaveLength(2);
    expect(
      screen.getByText(/pdf, cliquez pour ouvrir/i),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });

  it("rend le bouton de retrait hors du lien", () => {
    render(<ListePiecesIdentite pieces={pieces} />);
    const bouton = screen.getByRole("button", { name: /retirer cette pièce/i });
    expect(bouton.closest("a")).toBeNull();
  });

  it("ne propose le retrait que sur une pièce refusée", () => {
    render(<ListePiecesIdentite pieces={pieces} />);
    expect(
      screen.getAllByRole("button", { name: /retirer cette pièce/i }),
    ).toHaveLength(1);
  });

  it("ne montre pas une pièce retirée", () => {
    render(<ListePiecesIdentite pieces={pieces} />);
    expect(screen.queryByText("Retirée")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("montre le verdict de chaque pièce au client", () => {
    render(<ListePiecesIdentite pieces={pieces} />);
    expect(screen.getByText("Acceptée par le distributeur")).toBeInTheDocument();
    expect(screen.getByText("Pas encore vue")).toBeInTheDocument();
    expect(screen.getByText("Refusée — à refaire")).toBeInTheDocument();
  });

  it("montre au client le motif du refus, sans nom ni date de vision", () => {
    const { container } = render(<ListePiecesIdentite pieces={pieces} />);
    expect(
      screen.getByText(/photo trop floue, envoyez une cni lisible/i),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/vu le/i);
  });

  it("n'emploie aucun terme interdit du glossaire", () => {
    const { container } = render(<ListePiecesIdentite pieces={pieces} />);
    const texte = (container.textContent ?? "").toLowerCase();
    for (const interdit of ["shop", "réalisation", "realisation", "vente", "e-money", "virtuel"]) {
      expect(texte).not.toContain(interdit);
    }
  });
});
