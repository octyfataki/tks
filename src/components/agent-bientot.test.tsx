import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BanknoteIcon } from "lucide-react";
import { AgentBientot } from "./agent-bientot";

describe("AgentBientot", () => {
  it("annonce l'écran et la suite sans proposer d'action métier", () => {
    render(
      <AgentBientot
        icone={<BanknoteIcon />}
        titre="Encaissements"
        texte="Encaisser au comptoir, en espèces ou en mobile money."
        suite="L'encaissement arrive avec S6."
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Encaissements" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/encaisser au comptoir/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/arrive avec S6/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
