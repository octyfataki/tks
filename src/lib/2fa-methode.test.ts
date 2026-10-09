import { describe, expect, it } from "vitest";
import {
  clePreferenceMethode2fa,
  estMethodeEnvoi2fa,
  lireDefi2fa,
} from "./2fa-methode";

// La clé de préférence doit reprendre le jeton BRUT (sans signature) :
// better-auth compare avec la valeur de getSignedCookie, qui s'arrête au
// dernier « . ». Avec la valeur signée complète, la préférence n'est jamais
// retrouvée — et l'envoi retombe en silence sur les deux méthodes.
const JETON = "2fa-WKDKhWRH-0hL5VxcDUt9";
const SIGNATURE = `${JETON}.${"A".repeat(43)}=`;

describe("lireDefi2fa", () => {
  it("retire la signature du cookie (format valeur.signature)", () => {
    expect(
      lireDefi2fa(`better-auth.two_factor=${SIGNATURE}; autre=1`),
    ).toBe(JETON);
  });

  it("accepte le préfixe __Secure- (production https)", () => {
    expect(
      lireDefi2fa(`__Secure-better-auth.two_factor=${SIGNATURE}`),
    ).toBe(JETON);
  });

  it("refuse un cookie absent ou sans jeton 2fa-", () => {
    expect(lireDefi2fa("autre=1")).toBeNull();
    expect(
      lireDefi2fa("better-auth.two_factor=nimporte-quoi"),
    ).toBeNull();
    expect(lireDefi2fa("")).toBeNull();
  });
});

describe("garde-fou méthode", () => {
  it("n'accepte que sms ou email", () => {
    expect(estMethodeEnvoi2fa("sms")).toBe(true);
    expect(estMethodeEnvoi2fa("email")).toBe(true);
    expect(estMethodeEnvoi2fa("pigeon")).toBe(false);
    expect(estMethodeEnvoi2fa(undefined)).toBe(false);
  });

  it("construit la clé de préférence", () => {
    expect(clePreferenceMethode2fa(JETON)).toBe(`2fa-methode-${JETON}`);
  });
});
