import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  comptesClients,
  comptesStaff,
  piecesIdentiteClients,
} from "@/lib/db/schema/s1-comptes";

const RACINE_PIECES = join(process.cwd(), "donnees");

/**
 * GET /api/pieces-clients/[id] — la pièce vue par l'humain qui tranche.
 * Jamais publique : administrateur validé (principal ou technique), ou le
 * client propriétaire du compte. Le fichier sort en lecture seule, avec
 * son type d'origine (image ou PDF).
 */
export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ erreur: "Non connecté." }, { status: 401 });

  const lignes = await db
    .select({
      id: piecesIdentiteClients.id,
      compteClientId: piecesIdentiteClients.compteClientId,
      mime: piecesIdentiteClients.mime,
      referenceImage: piecesIdentiteClients.referenceImage,
    })
    .from(piecesIdentiteClients)
    .where(eq(piecesIdentiteClients.id, id))
    .limit(1);
  const piece = lignes[0];
  if (!piece) return NextResponse.json({ erreur: "Pièce introuvable." }, { status: 404 });

  const staff = await db
    .select({ role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const estAdmin =
    staff[0] !== undefined &&
    staff[0].etat === "VALIDE" &&
    (staff[0].role === "ADMIN_PRINCIPAL" || staff[0].role === "ADMIN_TECHNIQUE");

  let estProprietaire = false;
  if (!estAdmin) {
    const comptes = await db
      .select({ id: comptesClients.id })
      .from(comptesClients)
      .where(eq(comptesClients.betterAuthUserId, userId))
      .limit(1);
    estProprietaire =
      comptes[0] !== undefined && comptes[0].id === piece.compteClientId;
  }
  if (!estAdmin && !estProprietaire) {
    return NextResponse.json({ erreur: "Accès refusé." }, { status: 403 });
  }

  const absolu = resolve(RACINE_PIECES, piece.referenceImage);
  if (!absolu.startsWith(RACINE_PIECES + sep)) {
    return NextResponse.json({ erreur: "Pièce illisible." }, { status: 400 });
  }
  let octets: Buffer;
  try {
    octets = await readFile(absolu);
  } catch {
    return NextResponse.json({ erreur: "Pièce illisible." }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(octets), {
    headers: {
      "Content-Type": piece.mime,
      "Content-Disposition": `inline; filename="piece-${piece.id}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
