import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DateDuJour, TauxDuJour } from "@/components/daily-rate";

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

  it("ouvre un modal en lecture seule sans la permission de saisie", async () => {
    render(<TauxDuJour taux={null} peutSaisir={false} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Voir le taux du jour" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Taux du jour" }),
    ).toBeInTheDocument();
    // Pas de formulaire de saisie : la permission `taux.saisir` manque.
    expect(
      screen.queryByRole("button", { name: "Enregistrer" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/lecture seule/i)).toBeInTheDocument();
  });

  it("refuse une valeur non entière sans appeler l'enregistrement", async () => {
    const onEnregistrer = vi.fn(async () => ({ ok: true as const }));
    render(<TauxDuJour taux={null} onEnregistrer={onEnregistrer} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Saisir le taux du jour" }),
    );
    await screen.findByRole("dialog", { name: "Taux du jour" });
    fireEvent.change(
      screen.getByLabelText(/valeur — francs pour 1 dollar/i),
      { target: { value: "2300.5" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      screen.getByText("Saisir un nombre entier de francs, pour 1 USD."),
    ).toBeInTheDocument();
    expect(onEnregistrer).not.toHaveBeenCalled();
  });

  it("affiche le refus du serveur et laisse le modal ouvert", async () => {
    render(
      <TauxDuJour
        taux={null}
        onEnregistrer={async () => ({
          ok: false as const,
          erreur:
            "Un taux existe déjà pour ce jour : une seconde saisie ne remplace jamais la première.",
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Saisir le taux du jour" }),
    );
    await screen.findByRole("dialog", { name: "Taux du jour" });
    fireEvent.change(
      screen.getByLabelText(/valeur — francs pour 1 dollar/i),
      { target: { value: "2500" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText(/une seconde saisie ne remplace jamais/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Taux du jour" }),
    ).toBeInTheDocument();
  });

  it("ferme le modal après un enregistrement réussi", async () => {
    render(
      <TauxDuJour taux={null} onEnregistrer={async () => ({ ok: true })} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Saisir le taux du jour" }),
    );
    await screen.findByRole("dialog", { name: "Taux du jour" });
    fireEvent.change(
      screen.getByLabelText(/valeur — francs pour 1 dollar/i),
      { target: { value: "2300" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Taux du jour" }),
      ).not.toBeInTheDocument(),
    );
  });
});
