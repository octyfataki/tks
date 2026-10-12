import { describe, expect, it } from "vitest";
import {
  ENTETE_ACTION,
  ENTETE_PREFETCH_RSC,
  ENTETE_RSC,
  estClicDeNavigationInterne,
  estUneRequeteDeNavigation,
  estUneServerAction,
  estUnPrefetch,
  type ClicSurLien,
} from "./progression-navigation";

const ORIGINE = "https://tks.example";

function clic(
  surcharge: Omit<Partial<ClicSurLien>, "href" | "urlCourante"> & {
    href?: ClicSurLien["href"];
    urlCourante?: string;
  },
) {
  return estClicDeNavigationInterne({
    href: "/agent",
    urlCourante: `${ORIGINE}/clients`,
    ...surcharge,
  });
}

describe("estClicDeNavigationInterne", () => {
  it("accepte un lien interne, absolu ou relatif", () => {
    expect(clic({ href: "/agent" })).toBe(true);
    expect(clic({ href: "agent" })).toBe(true);
    expect(clic({ href: `${ORIGINE}/agent` })).toBe(true);
  });

  it("accepte un même chemin dont seuls les paramètres changent", () => {
    expect(
      clic({ href: "/clients?statut=PRIVILEGIE", urlCourante: `${ORIGINE}/clients` }),
    ).toBe(true);
  });

  it("refuse un lien externe", () => {
    expect(clic({ href: "https://orange.cd/agence" })).toBe(false);
  });

  it("refuse les protocoles non navigables", () => {
    expect(clic({ href: "mailto:chef@tks.example" })).toBe(false);
    expect(clic({ href: "tel:+243810000000" })).toBe(false);
    expect(clic({ href: "javascript:void 0" })).toBe(false);
  });

  it("refuse ce qui ouvre un autre onglet", () => {
    expect(clic({ href: "/agent", ctrlKey: true })).toBe(false);
    expect(clic({ href: "/agent", metaKey: true })).toBe(false);
    expect(clic({ href: "/agent", shiftKey: true })).toBe(false);
    expect(clic({ href: "/agent", altKey: true })).toBe(false);
    expect(clic({ href: "/agent", target: "_blank" })).toBe(false);
    expect(clic({ href: "/agent", target: "nouvel-onglet" })).toBe(false);
  });

  it("accepte target=_self", () => {
    expect(clic({ href: "/agent", target: "_self" })).toBe(true);
  });

  it("refuse un téléchargement et les clics non primaires", () => {
    expect(clic({ href: "/agent", telechargement: true })).toBe(false);
    expect(clic({ href: "/agent", telechargement: false })).toBe(true);
    expect(clic({ href: "/agent", button: 1 })).toBe(false);
    expect(clic({ href: "/agent", button: 2 })).toBe(false);
  });

  it("refuse rel=external", () => {
    expect(clic({ href: "/agent", rel: "external" })).toBe(false);
    expect(clic({ href: "/agent", rel: "noopener external" })).toBe(false);
    expect(clic({ href: "/agent", rel: "noopener" })).toBe(true);
  });

  it("refuse un clic neutralisé et un href absent", () => {
    expect(clic({ href: "/agent", defaultPrevented: true })).toBe(false);
    expect(clic({ href: null })).toBe(false);
    expect(clic({ href: "" })).toBe(false);
  });

  it("refuse un clic qui ne change ni le chemin ni les paramètres", () => {
    expect(
      clic({ href: "/clients", urlCourante: `${ORIGINE}/clients` }),
    ).toBe(false);
    expect(
      clic({ href: "/clients#encours", urlCourante: `${ORIGINE}/clients` }),
    ).toBe(false);
    expect(
      clic({
        href: "/clients?page=1",
        urlCourante: `${ORIGINE}/clients?page=1`,
      }),
    ).toBe(false);
  });

  it("refuse une URL courante illisible", () => {
    expect(clic({ href: "/agent", urlCourante: "pas-une-url" })).toBe(false);
  });
});

describe("estUneRequeteDeNavigation", () => {
  it("reconnaît une requête RSC nue", () => {
    expect(estUneRequeteDeNavigation({ [ENTETE_RSC]: "1" })).toBe(true);
  });

  it("refuse un préchargement RSC", () => {
    expect(
      estUneRequeteDeNavigation({
        [ENTETE_RSC]: "1",
        [ENTETE_PREFETCH_RSC]: "1",
      }),
    ).toBe(false);
  });

  it("refuse un préchargement navigateur (purpose)", () => {
    expect(
      estUneRequeteDeNavigation({ [ENTETE_RSC]: "1", purpose: "prefetch" }),
    ).toBe(false);
  });

  it("refuse une server action", () => {
    expect(
      estUneRequeteDeNavigation({ [ENTETE_ACTION]: "abc123" }),
    ).toBe(false);
  });

  it("refuse une requête sans en-tête RSC", () => {
    expect(estUneRequeteDeNavigation(undefined)).toBe(false);
    expect(estUneRequeteDeNavigation({})).toBe(false);
    expect(estUneRequeteDeNavigation({ "content-type": "text/plain" })).toBe(
      false,
    );
  });

  it("lit les trois formes d'en-têtes acceptées par fetch", () => {
    expect(estUneRequeteDeNavigation(new Headers({ [ENTETE_RSC]: "1" }))).toBe(
      true,
    );
    expect(estUneRequeteDeNavigation([[ENTETE_RSC, "1"]])).toBe(true);
    expect(estUneRequeteDeNavigation({ rsc: "1" })).toBe(true);
  });

  it("ignore la casse des noms d'en-têtes", () => {
    expect(estUneRequeteDeNavigation({ RSC: "1" })).toBe(true);
    expect(
      estUneRequeteDeNavigation({ "next-router-prefetch": "1", rsc: "1" }),
    ).toBe(false);
    expect(estUneRequeteDeNavigation({ "next-action": "abc" })).toBe(false);
  });
});

describe("garde-fous exposés", () => {
  it("sépare bien prefetch et server action", () => {
    expect(estUnPrefetch({ [ENTETE_PREFETCH_RSC]: "1" })).toBe(true);
    expect(estUnPrefetch({ [ENTETE_RSC]: "1" })).toBe(false);
    expect(estUneServerAction({ [ENTETE_ACTION]: "abc" })).toBe(true);
    expect(estUneServerAction({ [ENTETE_RSC]: "1" })).toBe(false);
  });
});
