import { describe, expect, it } from "vitest";
import {
  evaluatePasswordStrength,
  validatePasswordChange,
} from "@/app/agent/settings/password-validation";

describe("validatePasswordChange", () => {
  const valid = {
    currentPassword: "ancien-mot-de-passe",
    newPassword: "nouveau-mot-de-passe",
    confirmation: "nouveau-mot-de-passe",
  };

  it("accepte un changement bien formé", () => {
    expect(validatePasswordChange(valid)).toBeNull();
  });

  it("exige le mot de passe actuel", () => {
    expect(
      validatePasswordChange({ ...valid, currentPassword: "" }),
    ).toContain("actuel");
  });

  it("refuse un nouveau mot de passe trop court", () => {
    expect(
      validatePasswordChange({
        ...valid,
        newPassword: "court",
        confirmation: "court",
      }),
    ).toContain("8 caractères");
  });

  it("refuse une confirmation différente", () => {
    expect(
      validatePasswordChange({ ...valid, confirmation: "autre-mot-de-passe" }),
    ).toContain("confirmation");
  });

  it("refuse un nouveau mot de passe identique à l'actuel", () => {
    expect(
      validatePasswordChange({
        currentPassword: "meme-mot-de-passe",
        newPassword: "meme-mot-de-passe",
        confirmation: "meme-mot-de-passe",
      }),
    ).toContain("différent");
  });
});

describe("evaluatePasswordStrength", () => {
  it("juge trop court sous 8 caractères", () => {
    expect(evaluatePasswordStrength("abc")).toEqual({
      level: 0,
      label: "Trop court",
    });
    expect(evaluatePasswordStrength("1234567").level).toBe(0);
  });

  it("monte avec la longueur et la variété", () => {
    expect(evaluatePasswordStrength("huitcara").level).toBe(1);
    expect(evaluatePasswordStrength("huitcaractere12").level).toBeGreaterThan(1);
    expect(evaluatePasswordStrength("Comptoir-Kinshasa-2026!").level).toBe(4);
  });
});
