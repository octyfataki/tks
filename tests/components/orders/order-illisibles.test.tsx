import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderIllisibles } from "@/components/orders/order-illisibles";

describe("OrderIllisibles", () => {
  it("se rend vide sans état illisible", () => {
    const { container } = render(<OrderIllisibles illisibles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("liste une commande illisible avec sa raison", () => {
    render(
      <OrderIllisibles
        illisibles={[
          { id: "0a1b2c3d-0000-0000-0000-000000000000", raison: "Événement inconnu : MUTATION" },
        ]}
      />,
    );
    const alerte = screen.getByRole("alert");
    expect(alerte).toHaveTextContent("1 commande à l'état illisible");
    expect(alerte).toHaveTextContent("0a1b2c3d");
    expect(alerte).toHaveTextContent("Événement inconnu : MUTATION");
  });

  it("compte plusieurs commandes illisibles", () => {
    render(
      <OrderIllisibles
        illisibles={[
          { id: "aaaaaaaa", raison: "A" },
          { id: "bbbbbbbb", raison: "B" },
        ]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "2 commandes à l'état illisible",
    );
  });
});
