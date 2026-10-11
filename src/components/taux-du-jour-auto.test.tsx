import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  chargerTauxDuJourAction,
  enregistrerTauxDuJourAction,
} from "@/components/taux-actions";
import { TauxDuJourAuto } from "./taux-du-jour-auto";

// Les server actions tirent db + env (DATABASE_URL) : hors sujet ici.
vi.mock("@/components/taux-actions", () => ({
  chargerTauxDuJourAction: vi.fn(),
  enregistrerTauxDuJourAction: vi.fn(),
}));

const charger = vi.mocked(chargerTauxDuJourAction);
const enregistrer = vi.mocked(enregistrerTauxDuJourAction);

/**
 * S3 — pastille branchée : lecture du taux + permission au montage, saisie
 * journalisée au bouton, refus serveur affiché dans le modal.
 */
describe("TauxDuJourAuto", () => {
  it("affiche le taux chargé et propose la saisie à un compte autorisé", async () => {
    charger.mockResolvedValue({
      ok: true,
      taux: { valeur: 2300, dateSaisie: "2026-10-10" },
      peutSaisir: true,
    });
    render(<TauxDuJourAuto />);

    expect(await screen.findByText("1 USD = 2 300 CDF")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Saisir le taux du jour" }),
    );
    await screen.findByRole("dialog", { name: "Taux du jour" });
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
  });

  it("sans la permission, le modal s'ouvre en lecture seule", async () => {
    charger.mockResolvedValue({
      ok: true,
      taux: { valeur: 2300, dateSaisie: "2026-10-10" },
      peutSaisir: false,
    });
    render(<TauxDuJourAuto />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Voir le taux du jour" }),
    );
    await screen.findByRole("dialog", { name: "Taux du jour" });
    expect(
      screen.queryByRole("button", { name: "Enregistrer" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/lecture seule/i)).toBeInTheDocument();
  });

  it("enregistre la saisie et met à jour la pastille", async () => {
    charger.mockResolvedValue({ ok: true, taux: null, peutSaisir: true });
    enregistrer.mockResolvedValue({
      ok: true,
      taux: { valeur: 2500, dateSaisie: "2026-10-10" },
    });
    render(<TauxDuJourAuto />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Saisir le taux du jour" }),
    );
    await screen.findByRole("dialog", { name: "Taux du jour" });
    fireEvent.change(
      screen.getByLabelText(/valeur — francs pour 1 dollar/i),
      { target: { value: "2500" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(enregistrer).toHaveBeenCalledWith(2500));
    expect(await screen.findByText("1 USD = 2 500 CDF")).toBeInTheDocument();
  });

  it("affiche le refus du serveur sans fermer le modal", async () => {
    charger.mockResolvedValue({
      ok: true,
      taux: { valeur: 2300, dateSaisie: "2026-10-10" },
      peutSaisir: true,
    });
    enregistrer.mockResolvedValue({
      ok: false,
      erreur:
        "Un taux existe déjà pour ce jour : une seconde saisie ne remplace jamais la première.",
    });
    render(<TauxDuJourAuto />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Saisir le taux du jour" }),
    );
    await screen.findByRole("dialog", { name: "Taux du jour" });
    fireEvent.change(
      screen.getByLabelText(/valeur — francs pour 1 dollar/i),
      { target: { value: "2400" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText(/une seconde saisie ne remplace jamais/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Taux du jour" }),
    ).toBeInTheDocument();
    // La pastille garde le taux en vigueur, pas la valeur refusée.
    expect(screen.getByText("1 USD = 2 300 CDF")).toBeInTheDocument();
  });

  it("une lecture en panne retombe en lecture seule sans inventer de taux", async () => {
    charger.mockResolvedValue({ ok: false, erreur: "Taux du jour indisponible." });
    render(<TauxDuJourAuto />);

    expect(await screen.findByText("Taux du jour : —")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Voir le taux du jour" }),
    );
    await screen.findByRole("dialog", { name: "Taux du jour" });
    expect(
      screen.queryByRole("button", { name: "Enregistrer" }),
    ).not.toBeInTheDocument();
  });
});