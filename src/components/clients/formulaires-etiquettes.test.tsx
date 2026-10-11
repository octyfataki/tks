import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "@/components/ui/toast";
import {
  poserEtiquetteAction,
  retirerEtiquetteAction,
} from "./actions";
import { FormulairesEtiquettes } from "./formulaires-etiquettes";

vi.mock("./actions", () => ({
  poserEtiquetteAction: vi.fn(),
  retirerEtiquetteAction: vi.fn(),
}));

// S4 issue #7 — tout le feedback (succès comme refus) passe par les
// toasts, pas de message inline : sans toast, une pose réussie est muette
// et un refus n'est visible nulle part.

describe("FormulairesEtiquettes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("explique le refus au lieu d'afficher des boutons sans effet", () => {
    render(
      <FormulairesEtiquettes compteId="c1" actives={[]} peutAnnoter={false} />,
    );
    expect(
      screen.getByText(/réservée aux comptes autorisés/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Bon payeur/ }),
    ).not.toBeInTheDocument();
  });

  it("annonce la pose en toast de succès", async () => {
    vi.mocked(poserEtiquetteAction).mockResolvedValue({
      ok: true,
      compteId: "c1",
      etiquette: "BON_PAYEUR",
    });
    const ajouter = vi.spyOn(toast, "add");
    render(
      <FormulairesEtiquettes compteId="c1" actives={[]} peutAnnoter />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Bon payeur/ }));

    await waitFor(() => {
      expect(ajouter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "Étiquette « Bon payeur » posée",
        }),
      );
    });
    expect(poserEtiquetteAction).toHaveBeenCalled();
  });

  it("annonce le retrait en toast de succès", async () => {
    vi.mocked(retirerEtiquetteAction).mockResolvedValue({
      ok: true,
      compteId: "c1",
      etiquette: "BON_PAYEUR",
    });
    const ajouter = vi.spyOn(toast, "add");
    render(
      <FormulairesEtiquettes
        compteId="c1"
        actives={["BON_PAYEUR"]}
        peutAnnoter
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Bon payeur/ }));

    await waitFor(() => {
      expect(ajouter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "Étiquette « Bon payeur » retirée",
        }),
      );
    });
    expect(retirerEtiquetteAction).toHaveBeenCalled();
  });

  it("annonce le refus en toast d'erreur avec le motif", async () => {
    vi.mocked(poserEtiquetteAction).mockResolvedValue({
      ok: false,
      erreur: "Annotation impossible : journal indisponible.",
    });
    const ajouter = vi.spyOn(toast, "add");
    render(
      <FormulairesEtiquettes compteId="c1" actives={[]} peutAnnoter />,
    );

    fireEvent.click(screen.getByRole("button", { name: /À surveiller/ }));

    await waitFor(() => {
      expect(ajouter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Étiquette non posée",
          description: "Annotation impossible : journal indisponible.",
        }),
      );
    });
  });
});
