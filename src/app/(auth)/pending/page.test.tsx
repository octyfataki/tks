import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRouter } from "next/navigation";
import PendingVue from "./pending-vue";
import PendingPageServeur from "./page";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import type { Profil } from "@/lib/s1-comptes/role-session";
import { signOut } from "@/lib/auth-client";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  })),
  redirect: (url: string) => {
    const erreur = new Error("NEXT_REDIRECT");
    (erreur as Error & { digest?: string }).digest = `${url};replace`;
    throw erreur;
  },
}));

vi.mock("@/lib/s1-comptes/profil-session", () => ({
  profilSession: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  signOut: vi.fn(),
}));

vi.mock("./actions-depot", () => ({
  deposerPieceIdentiteAction: vi.fn(),
}));

async function destinationServeur(profil: Profil): Promise<string> {
  vi.mocked(profilSession).mockResolvedValueOnce(profil);
  const erreur = await PendingPageServeur().catch((e: unknown) => e);
  return (erreur as Error & { digest?: string }).digest ?? "";
}

function simulerStatut(corps: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(corps),
    }),
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  vi.mocked(useRouter).mockReset();
  vi.mocked(useRouter).mockReturnValue({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  } as unknown as ReturnType<typeof useRouter>);
});

describe("page /pending", () => {
  it("montre le visage d'attente sans motif quand le compte attend", async () => {
    simulerStatut({
      connecte: true,
      etat: "EN_ATTENTE_VALIDATION",
      motifRefus: null,
      pieces: [],
    });
    render(<PendingVue />);
    expect(screen.getByText("En attente")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /votre compte attend sa validation/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    await waitFor(() =>
      expect(screen.getByText("En cours")).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/cliquez ou déposez votre pièce ici/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /envoyer la pièce/i }),
    ).toBeDisabled();
  });

  it("montre le motif du distributeur et la reprise quand le compte est refusé", async () => {
    simulerStatut({
      connecte: true,
      etat: "REFUSE",
      motifRefus: "Photo floue, renvoyez une CNI lisible.",
      pieces: [],
    });
    render(<PendingVue />);
    await waitFor(() =>
      expect(screen.getByText("Refusé")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /le distributeur n'a pas validé votre compte/i,
      }),
    ).toBeInTheDocument();
    const alerte = screen.getByRole("alert");
    expect(alerte.textContent).toMatch(/photo floue/i);
    expect(alerte.textContent).toMatch(/sans réinscription/i);
    expect(screen.getAllByText("À reprendre").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.queryByText("En attente")).toBeNull();
  });

  it("affiche l'identité de la session plutôt que le récapitulatif local", async () => {
    window.sessionStorage.setItem(
      "tks-inscription",
      JSON.stringify({
        data: {
          name: "Vieux nom local",
          email: "vieux@example.com",
          telephone: "+243800000000",
        },
      }),
    );
    simulerStatut({
      connecte: true,
      etat: "EN_ATTENTE_VALIDATION",
      motifRefus: null,
      nom: "Amina de la session",
      email: "amina@example.com",
      telephone: "+243815000000",
      inscritLe: new Date("2026-10-01T10:00:00Z").toISOString(),
      pieces: [],
    });
    render(<PendingVue />);
    await waitFor(() =>
      expect(screen.getByText("Amina de la session")).toBeInTheDocument(),
    );
    expect(screen.getByText("amina@example.com")).toBeInTheDocument();
    expect(screen.getByText("+243815000000")).toBeInTheDocument();
    expect(screen.queryByText("Vieux nom local")).toBeNull();
    expect(screen.queryByText("vieux@example.com")).toBeNull();
  });

  it("montre les pièces déjà déposées en galerie", async () => {
    simulerStatut({
      connecte: true,
      etat: "EN_ATTENTE_VALIDATION",
      motifRefus: null,
      nom: null,
      email: null,
      telephone: null,
      inscritLe: null,
      pieces: [
        {
          id: "piece-1",
          typePiece: "CNI",
          mime: "image/jpeg",
          vue: true,
          deposeLe: new Date("2026-10-02T10:00:00Z").toISOString(),
        },
      ],
    });
    render(<PendingVue />);
    await waitFor(() =>
      expect(screen.getByText(/pièces déjà déposées/i)).toBeInTheDocument(),
    );
    const vignette = screen.getByRole("link", { name: /cni, voir en grand/i });
    expect(vignette.getAttribute("href")).toBe("/api/pieces-clients/piece-1");
    expect(screen.getByText(/vue par le distributeur/i)).toBeInTheDocument();
  });

  it("reste en attente sans formulaire quand personne n'est connecté", async () => {
    simulerStatut({ connecte: false });
    render(<PendingVue />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /votre compte attend sa validation/i,
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("En attente")).toBeInTheDocument(),
    );
    expect(
      screen.queryByLabelText(/déposer votre pièce/i),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /se déconnecter/i })).toBeNull();
    expect(
      screen.getAllByRole("link", { name: /retour à la connexion/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("propose de se déconnecter quand le compte est connecté", async () => {
    simulerStatut({
      connecte: true,
      etat: "EN_ATTENTE_VALIDATION",
      motifRefus: null,
      nom: null,
      email: null,
      telephone: null,
      inscritLe: null,
      pieces: [],
    });
    render(<PendingVue />);
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: /se déconnecter/i }).length,
      ).toBeGreaterThanOrEqual(1),
    );
    expect(
      screen.queryByRole("link", { name: /retour à la connexion/i }),
    ).toBeNull();
  });

  it("ferme la session au clic sur Se déconnecter", async () => {
    simulerStatut({
      connecte: true,
      etat: "EN_ATTENTE_VALIDATION",
      motifRefus: null,
      nom: null,
      email: null,
      telephone: null,
      inscritLe: null,
      pieces: [],
    });
    render(<PendingVue />);
    const boutons = await screen.findAllByRole("button", {
      name: /se déconnecter/i,
    });
    fireEvent.click(boutons[0]);
    await waitFor(() => expect(signOut).toHaveBeenCalled());
  });

  it("renvoie l'anonyme sans récapitulatif vers la connexion", async () => {
    simulerStatut({ connecte: false });
    const remplacer = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      refresh: vi.fn(),
      replace: remplacer,
    } as unknown as ReturnType<typeof useRouter>);
    render(<PendingVue />);
    await waitFor(() =>
      expect(remplacer).toHaveBeenCalledWith("/sign-in"),
    );
  });

  it("garde la fiche du frais inscrit (récapitulatif local) sans le renvoyer", async () => {
    window.sessionStorage.setItem(
      "tks-inscription",
      JSON.stringify({
        data: {
          name: "Nouvel inscrit",
          email: "nouveau@example.com",
          telephone: "+243810000000",
        },
      }),
    );
    simulerStatut({ connecte: false });
    const remplacer = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      refresh: vi.fn(),
      replace: remplacer,
    } as unknown as ReturnType<typeof useRouter>);
    render(<PendingVue />);
    await waitFor(() =>
      expect(screen.getByText("Nouvel inscrit")).toBeInTheDocument(),
    );
    expect(remplacer).not.toHaveBeenCalled();
  });

  it("ne renvoie pas vers la connexion sur coupure réseau", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("coupure")),
    );
    const remplacer = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      refresh: vi.fn(),
      replace: remplacer,
    } as unknown as ReturnType<typeof useRouter>);
    render(<PendingVue />);
    await waitFor(() =>
      expect(screen.getByText("En attente")).toBeInTheDocument(),
    );
    expect(remplacer).not.toHaveBeenCalledWith("/sign-in");
  });

  it("garde le fond pointillé du thème derrière la fiche", () => {
    simulerStatut({ connecte: false });
    const { container } = render(<PendingVue />);
    const fond = container.querySelector(
      ".pointer-events-none.absolute.inset-0",
    );
    expect(fond?.getAttribute("style")).toMatch(/radial-gradient/);
  });
});

describe("page /pending — barrière serveur", () => {
  it("laisse un anonyme sans session voir la fiche", async () => {
    vi.mocked(profilSession).mockResolvedValueOnce({ type: "ANONYME" });
    await expect(PendingPageServeur()).resolves.toBeDefined();
  });

  it("laisse un client en attente rester sur sa fiche", async () => {
    expect(
      await destinationServeur({
        type: "CLIENT",
        etat: "EN_ATTENTE_VALIDATION",
      }),
    ).toBe("");
  });

  it("renvoie un client validé vers son espace", async () => {
    expect(
      await destinationServeur({ type: "CLIENT", etat: "VALIDE" }),
    ).toContain("/clients");
  });

  it("renvoie un client révoqué vers la connexion", async () => {
    expect(
      await destinationServeur({ type: "CLIENT", etat: "REVOQUE" }),
    ).toContain("/sign-in");
  });

  it("renvoie un profil INCONNU vers la connexion", async () => {
    expect(await destinationServeur({ type: "INCONNU" })).toContain(
      "/sign-in",
    );
  });

  it("renvoie un agent connecté vers son espace", async () => {
    expect(
      await destinationServeur({
        type: "STAFF",
        role: "AGENT",
        etat: "VALIDE",
      }),
    ).toContain("/agent");
  });
});
