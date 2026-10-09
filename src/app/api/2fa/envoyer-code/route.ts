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

// POST /api/2fa/envoyer-code — envoie le code 2FA sur la méthode demandée
// (corps : { methode: "sms" | "email" }).
//
// Pourquoi une route dédiée : le schéma better-auth de /two-factor/send-otp
// ne laisse passer aucun champ custom — le choix ne peut pas transiter par
// l'appel direct. La route (1) mémorise donc le choix sous
// `2fa-methode-<défi>` (10 min, même durée que le défi 2FA) puis (2) délègue
// l'envoi à better-auth avec les entêtes (cookie de défi) inchangés. Le mock
// d'envoi (src/lib/auth.ts) lit la préférence et n'envoie que sur la méthode
// demandée. « Méthode » et non « canal » : canal est réservé aux commandes
// (GLOSSARY — EN_LIGNE / PRESENTIEL).
//
// Réponses : { status: true, methode } en succès ; { code } sinon — mêmes
// codes que better-auth (OTP_*, INVALID_TWO_FACTOR_COOKIE, …) plus
// CANAL_INCONNU, traduits côté formulaire par messageErreurSecondFacteur.
// Le rate limit better-auth (3 envois/minute) s'applique via l'appel délégué.
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
    // Défi expiré ou absent : renvoyer un code est impossible, la reconnexion
    // est la seule issue (le formulaire y redirige).
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

// lireDefi2fa vit dans @/lib/2fa-methode (testé) : même représentation du
// jeton des deux côtés, sinon la préférence n'est jamais retrouvée.
