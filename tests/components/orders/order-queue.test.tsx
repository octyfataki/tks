import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { OrderQueue } from "@/components/orders/order-queue";
import type { OrderView } from "@/modules/orders/read";

const { pousses } = vi.hoisted(() => ({ pousses: [] as string[] }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: string) => pousses.push(url),
    replace: (url: string) => pousses.push(url),
    back: () => undefined,
    prefetch: () => undefined,
  }),
}));

vi.mock("@/modules/orders/actions", () => ({
  takeOrderAction: vi.fn(),
  serveOrderAction: vi.fn(),
  cancelOrderAction: vi.fn(),
}));

beforeEach(() => {
  pousses.length = 0;
});

function commande(id: string, etat: OrderView["state"]): OrderView {
  return {
    id,
    profileId: `profil-${id}`,
    profileName: `Client ${id}`,
    profilePhone: "+243 000 000 000",
    network: "ORANGE",
    channel: "COUNTER",
    type: "PREPAID",
    units: 100,
    amount: 2300,
    currency: "CDF",
    pricePerHundred: 2300,
    state: etat,
    lockedBy: null,
    lockedByName: null,
    lockedAt: null,
    lockExpired: false,
    proofId: null,
    refusalReason: null,
    createdAt: new Date("2026-01-05T10:00:00Z"),
  };
}

function pagination(nom: string, page = 1, totalPages = 4) {
  return {
    page,
    totalPages,
    hrefBase: `/admin/orders?tri=recents&onglet=${nom}`,
  };
}

function element(props: Partial<ComponentProps<typeof OrderQueue>> = {}) {
  return (
    <OrderQueue
      ongletInitial="prendre"
      prendre={[commande("a", "QUEUED")]}
      cours={[commande("b", "LOCKED")]}
      terminees={[commande("c", "SERVED")]}
      totaux={{ prendre: 1, cours: 1, terminees: 1 }}
      pagination={{
        prendre: pagination("prendre"),
        cours: pagination("cours"),
        terminees: pagination("terminees"),
      }}
      acteurId="agent-1"
      canServe
      canCancel
      retour="/admin/orders"
      {...props}
    />
  );
}

function rendre(props: Partial<ComponentProps<typeof OrderQueue>> = {}) {
  return render(element(props));
}

describe("OrderQueue", () => {
  it("ouvre l'onglet demandé par l'URL", () => {
    rendre({ ongletInitial: "cours" });
    const selection = Array.from(
      document.querySelectorAll("[data-slot=tabs-trigger]"),
    ).filter((onglet) => onglet.getAttribute("aria-selected") === "true");
    expect(selection).toHaveLength(1);
    expect(selection[0].textContent).toContain("En cours");
  });

  it("affiche les totaux des onglets, pas la tranche visible", () => {
    rendre({
      prendre: [],
      totaux: { prendre: 42, cours: 0, terminees: 0 },
    });
    expect(
      screen.getByRole("tab", { name: /À prendre\s*42/ }),
    ).toBeInTheDocument();
  });

  it("donne à chaque onglet sa propre pagination dans l'URL", () => {
    rendre({ ongletInitial: "prendre" });
    const liens = within(
      screen.getByRole("navigation", { name: "Pagination" }),
    ).getAllByRole("link");
    expect(liens.map((lien) => lien.getAttribute("href"))).toEqual([
      "/admin/orders?tri=recents&onglet=prendre&page=1",
      "/admin/orders?tri=recents&onglet=prendre&page=2",
      "/admin/orders?tri=recents&onglet=prendre&page=4",
      "/admin/orders?tri=recents&onglet=prendre&page=2",
    ]);
  });

  it("l'onglet terminées pagine aussi", () => {
    rendre({ ongletInitial: "terminees" });
    expect(
      screen.getByRole("link", { name: "Page 2" }),
    ).toHaveAttribute(
      "href",
      "/admin/orders?tri=recents&onglet=terminees&page=2",
    );
  });

  it("sans deuxième page, pas de pagination", () => {
    rendre({
      pagination: {
        prendre: pagination("prendre", 1, 1),
        cours: pagination("cours", 1, 1),
        terminees: pagination("terminees", 1, 1),
      },
    });
    expect(
      screen.queryByRole("navigation", { name: "Pagination" }),
    ).not.toBeInTheDocument();
  });

  it("garde la page demandée dans le lien", () => {
    rendre({
      ongletInitial: "terminees",
      pagination: {
        prendre: pagination("prendre"),
        cours: pagination("cours"),
        terminees: pagination("terminees", 3),
      },
    });
    expect(
      screen.getByRole("link", { name: "Page 2" }),
    ).toHaveAttribute("href", "/admin/orders?tri=recents&onglet=terminees&page=2");
  });

  it("une file vide d'aucun onglet : un seul message", () => {
    rendre({
      prendre: [],
      cours: [],
      terminees: [],
      totaux: { prendre: 0, cours: 0, terminees: 0 },
    });
    expect(screen.getByText("Aucune commande")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("un onglet vide garde son libellé et son message", () => {
    rendre({ ongletInitial: "cours", cours: [] });
    expect(screen.getByRole("tab", { name: /En cours/ })).toBeInTheDocument();
    expect(screen.getByText("Aucune commande en cours")).toBeInTheDocument();
  });

  it("un clic d'onglet écrit l'URL de cet onglet", () => {
    rendre({ ongletInitial: "terminees" });
    fireEvent.click(screen.getByRole("tab", { name: /À prendre/ }));
    expect(pousses).toEqual(["/admin/orders?tri=recents&onglet=prendre"]);
    expect(
      screen.getByRole("tab", { name: /À prendre/ }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("l'onglet déjà ouvert ne recharge pas la page", () => {
    rendre({ ongletInitial: "cours" });
    fireEvent.click(screen.getByRole("tab", { name: /En cours/ }));
    expect(pousses).toEqual([]);
  });

  it("un retour arrière du navigateur suit l'URL", () => {
    const { rerender } = rendre({ ongletInitial: "prendre" });
    rerender(element({ ongletInitial: "terminees" }));
    expect(
      screen.getByRole("tab", { name: /Terminées/ }),
    ).toHaveAttribute("aria-selected", "true");
  });
});
