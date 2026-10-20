import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DateDuJour, TauxDuJour } from "@/components/daily-rate";

vi.mock("@/components/rate-actions", () => ({
  chargerTauxEnVigueurAction: vi.fn(),
  enregistrerTauxAction: vi.fn(),
}));

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

    expect(screen.getByText("Taux en vigueur : —")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Taux en vigueur" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/aucun taux saisi pour le moment/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enregistrer" }),
    ).toBeDisabled();
  });

  it("affiche le montant natif d'abord, la date et la personne ensuite", async () => {
    render(
      <TauxDuJour taux={{ valeur: 2300, depuisLe: "2026-10-06", saisiPar: "Aline" }} />,
    );
    expect(screen.getByText("1 USD = 2 300 CDF")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Taux en vigueur" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/depuis le 6 octobre 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/par Aline/i)).toBeInTheDocument();
  });

  it("ouvre un modal en lecture seule sans la permission de saisie", async () => {
    render(<TauxDuJour taux={null} peutSaisir={false} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Consulter le taux" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Taux en vigueur" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enregistrer" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/lecture seule/i)).toBeInTheDocument();
  });

  it("refuse une valeur non entière sans appeler l'enregistrement", async () => {
    const onEnregistrer = vi.fn(async () => ({ ok: true as const }));
    render(<TauxDuJour taux={null} onEnregistrer={onEnregistrer} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    await screen.findByRole("dialog", { name: "Taux en vigueur" });
    fireEvent.change(
      screen.getByLabelText(/nouveau taux \(cdf pour 1 usd\)/i),
      { target: { value: "2300.5" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      screen.getByText("Saisir un nombre entier de francs, pour 1 USD."),
    ).toBeInTheDocument();
    expect(onEnregistrer).not.toHaveBeenCalled();
  });

  it("présente un second taux comme prise de relais, pas comme interdiction", async () => {
    const onEnregistrer = vi.fn(async () => ({ ok: true as const }));
    render(
      <TauxDuJour
        taux={{ valeur: 2300, depuisLe: "2026-10-06" }}
        onEnregistrer={onEnregistrer}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    await screen.findByRole("dialog", { name: "Taux en vigueur" });
    fireEvent.change(
      screen.getByLabelText(/nouveau taux \(cdf pour 1 usd\)/i),
      { target: { value: "2400" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(onEnregistrer).toHaveBeenCalledWith(2400));
    expect(
      screen.queryByText(/une seconde saisie ne remplace jamais/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Taux en vigueur" }),
    ).not.toBeInTheDocument();
  });

  it("avertit au-delà de 5 % et exige une confirmation explicite", async () => {
    const onEnregistrer = vi.fn(async () => ({ ok: true as const }));
    render(
      <TauxDuJour
        taux={{ valeur: 2300, depuisLe: "2026-10-06" }}
        onEnregistrer={onEnregistrer}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    await screen.findByRole("dialog", { name: "Taux en vigueur" });
    fireEvent.change(
      screen.getByLabelText(/nouveau taux \(cdf pour 1 usd\)/i),
      { target: { value: "2500" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Confirmer le changement" }),
      ).toBeEnabled(),
    );
    expect(
      screen.getByText(/les dettes en USD affichées changent de valeur/i),
    ).toBeInTheDocument();
    expect(onEnregistrer).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirmer le changement" }));
    await waitFor(() => expect(onEnregistrer).toHaveBeenCalledWith(2500));
  });

  it("demande la confirmation pour une ré-saisie identique côté serveur sans fermer", async () => {
    render(
      <TauxDuJour
        taux={{ valeur: 2300, depuisLe: "2026-10-06" }}
        onEnregistrer={async () => ({
          ok: false as const,
          erreur: "Ce taux est déjà en vigueur : rien à changer",
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    await screen.findByRole("dialog", { name: "Taux en vigueur" });
    fireEvent.change(
      screen.getByLabelText(/nouveau taux \(cdf pour 1 usd\)/i),
      { target: { value: "2300" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText(/rien à changer/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Taux en vigueur" }),
    ).toBeInTheDocument();
  });

  it("affiche l'historique, du plus récent au plus ancien", () => {
    render(
      <TauxDuJour
        taux={{ valeur: 2400, depuisLe: "2026-10-10" }}
        historique={[
          { valeur: 2400, jour: "2026-10-10", saisiPar: "Aline" },
          { valeur: 2300, jour: "2026-10-06" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Consulter ou saisir le taux" }));
    const dialogue = screen.getByRole("dialog", { name: "Taux en vigueur" });
    const lignes = dialogue.querySelectorAll("ul li");
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toHaveTextContent("2 400");
    expect(lignes[1]).toHaveTextContent("2 300");
    expect(lignes[0]).toHaveTextContent("Aline");
  });

  it("ferme le modal après un enregistrement réussi", async () => {
    render(
      <TauxDuJour taux={null} onEnregistrer={async () => ({ ok: true })} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    await screen.findByRole("dialog", { name: "Taux en vigueur" });
    fireEvent.change(
      screen.getByLabelText(/nouveau taux \(cdf pour 1 usd\)/i),
      { target: { value: "2300" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Taux en vigueur" }),
      ).not.toBeInTheDocument(),
    );
  });
});
