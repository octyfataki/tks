import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BanknoteIcon } from "lucide-react";
import { AgentComingSoon } from "./agent-coming-soon";

describe("AgentComingSoon", () => {
  it("annonce l'écran et la suite sans proposer d'action métier", () => {
    render(
      <AgentComingSoon
        icon={<BanknoteIcon />}
        title="Encaissements"
        text="Encaisser au comptoir, en espèces ou en mobile money."
        upcoming="L'encaissement arrive avec S6."
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
