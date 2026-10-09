import { describe, expect, it, vi } from "vitest";
import {
  MESSAGE_RESEAU,
  messageErreurConnexion,
  messageErreurSecondFacteur,
} from "./erreurs-auth";

// Garantie commune : aucun libellé anglais de Better Auth ne doit atteindre
// l'utilisateur, quel que soit le chemin d'erreur.

describe("messageErreurConnexion", () => {
  it("traduit les identifiants incorrects", () => {
    expect(
      messageErreurConnexion({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }),
    ).toBe("Email ou mot de passe incorrect.");
  });

  it("traduit l'email invalide", () => {
    expect(messageErreurConnexion({ code: "INVALID_EMAIL", status: 400 })).toBe(
      "Adresse email invalide.",
    );
  });

  it("traduit l'échec de création de session", () => {
    expect(
      messageErreurConnexion({ code: "FAILED_TO_CREATE_SESSION", status: 401 }),
    ).toBe("Impossible d'ouvrir la session. Réessayez.");
  });

  it("traduit le rate limit 429 (sans code, message anglais brut)", () => {
    expect(
      messageErreurConnexion({ message: "Too many requests. Please try again later.", status: 429 }),
    ).toBe("Trop de tentatives. Réessayez dans une minute.");
  });

  it("replie en français sur un code inconnu sans exposer l'anglais", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(
      messageErreurConnexion({ code: "SURPRISE", message: "Something went wrong", status: 500 }),
    ).toBe("Connexion refusée. Réessayez.");
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("replie en français quand aucune erreur n'est fournie", () => {
    expect(messageErreurConnexion(null)).toBe("Connexion refusée. Réessayez.");
  });
});

describe("messageErreurSecondFacteur", () => {
  it("traduit un code OTP incorrect", () => {
    expect(messageErreurSecondFacteur({ code: "INVALID_CODE", status: 400 })).toBe(
      "Code incorrect.",
    );
  });

  it("traduit le blocage temporaire du compte", () => {
    expect(
      messageErreurSecondFacteur({ code: "ACCOUNT_TEMPORARILY_LOCKED", status: 429 }),
    ).toBe("Trop d'échecs : compte temporairement bloqué. Réessayez plus tard.");
  });

  it("traduit le cookie de vérification expiré", () => {
    expect(
      messageErreurSecondFacteur({ code: "INVALID_TWO_FACTOR_COOKIE", status: 401 }),
    ).toBe("Vérification expirée : reconnectez-vous.");
  });

  it("traduit le rate limit 429", () => {
    expect(messageErreurSecondFacteur({ status: 429 })).toBe(
      "Trop de tentatives. Réessayez dans une minute.",
    );
  });

  it("traduit le code email expiré", () => {
    expect(
      messageErreurSecondFacteur({ message: "OTP has expired", code: "OTP_HAS_EXPIRED", status: 400 }),
    ).toBe("Code expiré. Demandez un nouveau code.");
  });

  it("traduit l'envoi du code indisponible", () => {
    expect(
      messageErreurSecondFacteur({ code: "OTP_NOT_ENABLED", status: 400 }),
    ).toBe("Envoi du code indisponible. Demandez un nouveau code.");
  });

  it("replie en français sans exposer l'anglais", () => {
    expect(
      messageErreurSecondFacteur({ message: "Something broke", code: "CODE_INCONNU_2FA", status: 400 }),
    ).toBe("Code refusé. Réessayez.");
  });
});

describe("MESSAGE_RESEAU", () => {
  it("est un libellé français", () => {
    expect(MESSAGE_RESEAU).toBe(
      "Impossible de joindre le serveur. Vérifiez votre connexion.",
    );
  });
});