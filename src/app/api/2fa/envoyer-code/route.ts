import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  clePreferenceMethode2fa,
  estMethodeEnvoi2fa,
  lireDefi2fa,
} from "@/lib/2fa-methode";
import { db } from "@/lib/db/client";
import { verification } from "@/lib/db/schema/auth-schema";

export async function POST(request: Request) {
  let methode: unknown;
  try {
    methode = (await request.json()).methode;
  } catch {
    methode = undefined;
  }
  if (!estMethodeEnvoi2fa(methode)) {
    return NextResponse.json(
      { code: "CANAL_INCONNU", message: "Méthode inconnue : sms ou email." },
      { status: 400 },
    );
  }

  const defi = lireDefi2fa((await headers()).get("cookie") ?? "");
  if (!defi) {
    return NextResponse.json(
      {
        code: "INVALID_TWO_FACTOR_COOKIE",
        message: "Vérification expirée : reconnectez-vous.",
      },
      { status: 401 },
    );
  }

  const identifiant = clePreferenceMethode2fa(defi);
  await db.delete(verification).where(eq(verification.identifier, identifiant));
  await db.insert(verification).values({
    id: randomUUID(),
    identifier: identifiant,
    value: methode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[auth] 2FA : préférence ${methode} mémorisée pour le défi …${defi.slice(-6)}`,
    );
  }

  try {
    await auth.api.sendTwoFactorOTP({
      body: { trustDevice: false },
      headers: await headers(),
    });
    return NextResponse.json({ status: true, methode });
  } catch (erreur) {
    const detail = erreur as {
      status?: number;
      statusCode?: number;
      body?: { code?: string };
      code?: string;
    } | null;
    const statut =
      detail?.statusCode ?? detail?.status ?? 400;
    const code = detail?.body?.code ?? detail?.code ?? "ENVOI_REFUSE";
    return NextResponse.json({ code }, { status: statut });
  }
}
