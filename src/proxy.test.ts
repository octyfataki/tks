import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import proxy, { config } from "./proxy";

function requete(url: string, method: string): NextRequest {
  return new NextRequest(new URL(url), { method });
}

describe("proxy — inscription publique fermée", () => {
  it("refuse la route Better Auth, quelle que soit la méthode", async () => {
    for (const method of ["GET", "POST", "PUT", "DELETE"]) {
      const res = await proxy(
        requete("http://localhost:3000/api/auth/sign-up/email", method),
      );
      expect(res.status).toBe(403);
      const corps = (await res.json()) as { code?: string };
      expect(corps.code).toBe("INSCRIPTION_FERMEE");
    }
  });

  it("ne laisse passer aucune sous-route sign-up", async () => {
    const res = await proxy(
      requete("http://localhost:3000/api/auth/sign-up/email/verify", "POST"),
    );
    expect(res.status).toBe(403);
  });

  it("déclare le matcher comme seul filtre", () => {
    expect(config.matcher).toEqual(["/api/auth/sign-up/:path*"]);
  });
});
