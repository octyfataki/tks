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
import { aPermission } from "@/lib/s2-autorisations/autorisations";
import {
  autoriseLecturePiece,
  type LecteurPiece,
} from "@/lib/s1-comptes/acces-piece-identite";

const RACINE_PIECES = join(process.cwd(), "donnees");

async function lecteurPiece(
  userId: string,
  staff: { id: string; role: string; etat: string } | undefined,
): Promise<LecteurPiece> {
  if (staff) {
    return {
      type: "STAFF",
      role: staff.role,
      etat: staff.etat,
      peutValider:
        staff.role === "AGENT" && staff.etat === "VALIDE"
          ? await aPermission(staff.id, "client.valider")
          : false,
    };
  }

  const comptes = await db
    .select({ id: comptesClients.id })
    .from(comptesClients)
    .where(eq(comptesClients.betterAuthUserId, userId))
    .limit(1);
  return comptes[0]
    ? { type: "CLIENT", compteClientId: comptes[0].id }
    : { type: "ANONYME" };
}

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
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const lecteur = await lecteurPiece(userId, staff[0]);

  const decision = autoriseLecturePiece(lecteur, piece.compteClientId);
  if (!decision.autorise) {
    return NextResponse.json({ erreur: decision.erreur }, { status: decision.statut });
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
