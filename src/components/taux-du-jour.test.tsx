import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DateDuJour, TauxDuJour } from "./taux-du-jour";

describe("DateDuJour", () => {
  it("affiche la date du jour en français", () => {
    render(<DateDuJour />);
    const attendu = new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
    }).format(new Date());
    const capitalise = attendu.charAt(0).toUpperCase() + attendu.slice(1);
    expect(screen.getByText(capitalise)).toBeInTheDocument();
  });
});

describe("TauxDuJour", () => {
  it("annonce l'absence de taux et ouvre le modal de saisie", async () => {
    render(<TauxDuJour taux={null} />);

    expect(screen.getByText("Taux du jour : —")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Saisir le taux du jour" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Taux du jour" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/aucun taux saisi aujourd'hui/i),
    ).toBeInTheDocument();
    // Sans onEnregistrer (tranche S3 à venir), la saisie reste inerte.
    expect(
      screen.getByRole("button", { name: "Enregistrer" }),
    ).toBeDisabled();
  });

  it("affiche le taux en vigueur quand il est fourni", () => {
    render(
      <TauxDuJour taux={{ valeur: 2300, dateSaisie: "2026-10-06" }} />,
    );
    expect(screen.getByText("1 USD = 2 300 CDF")).toBeInTheDocument();
  });

  it("reste informatif sans la permission de saisie", () => {
    render(<TauxDuJour taux={null} peutSaisir={false} />);
    expect(
      screen.queryByRole("button", { name: "Saisir le taux du jour" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Taux du jour : —")).toBeInTheDocument();
  });
});
