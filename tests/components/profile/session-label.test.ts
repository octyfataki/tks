import { describe, expect, it } from "vitest";
import {
  APPAREIL_INCONNU,
  formaterAdresseSession,
  libelleAppareil,
} from "@/components/profile/session-label";

describe("libelleAppareil", () => {
  it("nomme le navigateur et le système", () => {
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(libelleAppareil(userAgent)).toBe("Chrome sur Windows 10");
  });

  it("distingue Firefox sur Linux et Safari sur iPhone", () => {
    expect(
      libelleAppareil(
        "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
      ),
    ).toBe("Firefox sur Linux");
    expect(
      libelleAppareil(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Safari sur iPhone");
  });

  it("reconnaît une session serveur", () => {
    expect(libelleAppareil("node")).toBe("Session serveur (Node)");
    expect(libelleAppareil("opencode/latest/2.1.3/cli")).toBe(
      "Session opencode (CLI)",
    );
  });

  it("retombe sur un appareil inconnu", () => {
    expect(libelleAppareil(null)).toBe(APPAREIL_INCONNU);
    expect(libelleAppareil("   ")).toBe(APPAREIL_INCONNU);
    expect(libelleAppareil("bruit-inconnu")).toBe(APPAREIL_INCONNU);
  });
});

describe("formaterAdresseSession", () => {
  it("normalise le loopback IPv6 en IPv4", () => {
    expect(formaterAdresseSession("::1")).toBe("127.0.0.1");
    expect(formaterAdresseSession("0000:0000:0000:0000:0000:0000:0000:0000")).toBeNull();
    expect(formaterAdresseSession("::")).toBeNull();
    expect(formaterAdresseSession("::ffff:192.0.2.10")).toBe("192.0.2.10");
  });

  it("laisse une adresse ordinaire intacte", () => {
    expect(formaterAdresseSession("192.0.2.10")).toBe("192.0.2.10");
  });

  it("ne renvoie rien pour une adresse absente", () => {
    expect(formaterAdresseSession(null)).toBeNull();
    expect(formaterAdresseSession("")).toBeNull();
  });
});
