import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesClients } from "@/lib/db/schema/s1-comptes";

/**
 * GET /api/mon-compte/piece — état du dépôt pour le client connecté :
 * état du compte, motif de refus éventuel, pièces déjà déposées, et
 * identité de la session (nom, email, téléphone, date d'inscription) pour
 * que /pending affiche la fiche du compte connecté sans dépendre du
 * récapitulatif local. Anonyme ou staff : `{ connecte: false }`, sans détail.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ connecte: false });
  const lignes = await db
    .select({
      id: comptesClients.id,
      etat: comptesClients.etat,
      refuseMotif: comptesClients.refuseMotif,
      email: comptesClients.email,
      telephone: comptesClients.telephone,
      inscritLe: comptesClients.createdAt,
    })
    .from(comptesClients)
    .where(eq(comptesClients.betterAuthUserId, userId))
    .limit(1);
  const compte = lignes[0];
  if (!compte) return NextResponse.json({ connecte: false });
  const { lirePiecesCompte } = await import("@/lib/s1-comptes/pieces-clients");
  const pieces = await lirePiecesCompte(compte.id);
  return NextResponse.json({
    connecte: true,
    etat: compte.etat,
    motifRefus: compte.etat === "REFUSE" ? (compte.refuseMotif ?? null) : null,
    nom:
      typeof session.user?.name === "string" && session.user.name !== ""
        ? session.user.name
        : null,
    email: compte.email,
    telephone: compte.telephone,
    inscritLe: compte.inscritLe.toISOString(),
    pieces: pieces.map((p) => ({
      id: p.id,
      typePiece: p.typePiece,
      mime: p.mime,
      vue: p.vuePar !== null,
      deposeLe: p.deposeLe.toISOString(),
    })),
  });
}
