import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  chargerTauxEnVigueurAction,
  enregistrerTauxAction,
} from "@/components/rate-actions";
import { TauxDuJourAuto } from "@/components/auto-daily-rate";

vi.mock("@/components/rate-actions", () => ({
  chargerTauxEnVigueurAction: vi.fn(),
  enregistrerTauxAction: vi.fn(),
}));

const charger = vi.mocked(chargerTauxEnVigueurAction);
const enregistrer = vi.mocked(enregistrerTauxAction);

describe("TauxDuJourAuto", () => {
  it("affiche le taux chargé et propose la saisie à un compte autorisé", async () => {
    charger.mockResolvedValue({
      ok: true,
      taux: { valeur: 2300, depuisLe: "2026-10-10" },
      peutSaisir: true,
      historique: [],
    });
    render(<TauxDuJourAuto />);

    expect(await screen.findByText("1 USD = 2 300 CDF")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    await screen.findByRole("dialog", { name: "Taux en vigueur" });
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
  });

  it("sans la permission, le modal s'ouvre en lecture seule", async () => {
    charger.mockResolvedValue({
      ok: true,
      taux: { valeur: 2300, depuisLe: "2026-10-10" },
      peutSaisir: false,
      historique: [],
    });
    render(<TauxDuJourAuto />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Consulter le taux" }),
    );
    await screen.findByRole("dialog", { name: "Taux en vigueur" });
    expect(
      screen.queryByRole("button", { name: "Enregistrer" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/lecture seule/i)).toBeInTheDocument();
  });

  it("enregistre la saisie et met à jour la pastille et l'historique", async () => {
    charger.mockResolvedValue({
      ok: true,
      taux: { valeur: 2300, depuisLe: "2026-10-06" },
      peutSaisir: true,
      historique: [{ valeur: 2300, jour: "2026-10-06" }],
    });
    enregistrer.mockResolvedValue({
      ok: true,
      taux: { valeur: 2500, depuisLe: "2026-10-10" },
    });
    render(<TauxDuJourAuto />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    await screen.findByRole("dialog", { name: "Taux en vigueur" });
    fireEvent.change(
      screen.getByLabelText(/nouveau taux \(cdf pour 1 usd\)/i),
      { target: { value: "2500" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Confirmer le changement" }),
    );

    await waitFor(() => expect(enregistrer).toHaveBeenCalledWith(2500));
    expect(await screen.findByText("1 USD = 2 500 CDF")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    const dialogue = await screen.findByRole("dialog", { name: "Taux en vigueur" });
    expect(dialogue).toHaveTextContent("2 500");
    expect(dialogue).toHaveTextContent("2 300");
  });

  it("affiche le refus du serveur sans fermer le modal", async () => {
    charger.mockResolvedValue({
      ok: true,
      taux: { valeur: 2300, depuisLe: "2026-10-10" },
      peutSaisir: true,
      historique: [],
    });
    enregistrer.mockResolvedValue({
      ok: false,
      erreur: "Enregistrement impossible.",
    });
    render(<TauxDuJourAuto />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Consulter ou saisir le taux" }),
    );
    await screen.findByRole("dialog", { name: "Taux en vigueur" });
    fireEvent.change(
      screen.getByLabelText(/nouveau taux \(cdf pour 1 usd\)/i),
      { target: { value: "2400" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText(/enregistrement impossible/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Taux en vigueur" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 USD = 2 300 CDF")).toBeInTheDocument();
  });

  it("une lecture en panne retombe en lecture seule sans inventer de taux", async () => {
    charger.mockResolvedValue({
      ok: false,
      erreur: "Taux en vigueur indisponible.",
    });
    render(<TauxDuJourAuto />);

    expect(await screen.findByText("Taux en vigueur : —")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Consulter le taux" }),
    );
    await screen.findByRole("dialog", { name: "Taux en vigueur" });
    expect(
      screen.queryByRole("button", { name: "Enregistrer" }),
    ).not.toBeInTheDocument();
  });
});
