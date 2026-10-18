import { describe, expect, it } from "vitest";
import {
  EXPIRY_WARNING_THRESHOLD_DAYS,
  describeSessionExpiration,
} from "@/app/agent/settings/session-helpers";

describe("describeSessionExpiration", () => {
  const now = new Date("2026-10-01T08:00:00Z");

  it("annonce une expiration lointaine sans avertissement", () => {
    const description = describeSessionExpiration(
      new Date("2026-10-06T08:00:00Z"),
      now,
    );
    expect(description.daysRemaining).toBe(5);
    expect(description.isExpired).toBe(false);
    expect(description.expiresSoon).toBe(false);
    expect(description.formattedDate).not.toBe("Inconnue");
  });

  it("avertit quand il reste 2 jours ou moins", () => {
    expect(
      describeSessionExpiration(new Date("2026-10-03T08:00:00Z"), now)
        .expiresSoon,
    ).toBe(true);
    expect(
      describeSessionExpiration(new Date("2026-10-02T08:00:00Z"), now)
        .expiresSoon,
    ).toBe(true);
    expect(EXPIRY_WARNING_THRESHOLD_DAYS).toBe(2);
  });

  it("signale une session expirée", () => {
    const description = describeSessionExpiration(
      new Date("2026-09-30T08:00:00Z"),
      now,
    );
    expect(description.isExpired).toBe(true);
    expect(description.daysRemaining).toBe(0);
    expect(description.expiresSoon).toBe(false);
  });

  it("replie sur « Inconnue » quand l'expiration est illisible", () => {
    for (const value of [null, undefined, "pas-une-date"]) {
      const description = describeSessionExpiration(
        value as unknown as string,
        now,
      );
      expect(description.formattedDate).toBe("Inconnue");
      expect(description.daysRemaining).toBeNull();
      expect(description.isExpired).toBe(false);
    }
  });
});
