import { NextResponse } from "next/server";
import { aPermission } from "@/lib/authorizations/permissions";
import { currentStaffAccount, estRoleAdmin } from "@/lib/authorizations/staff-actor";
import { readProofFile } from "@/modules/proofs/review";

export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const compte = await currentStaffAccount();
  if (!compte) {
    return NextResponse.json({ erreur: "Non connecté." }, { status: 401 });
  }
  const peutLire =
    estRoleAdmin(compte.role) ||
    (await aPermission(compte.id, "preuve.valider"));
  if (!peutLire) {
    return NextResponse.json({ erreur: "Accès refusé." }, { status: 403 });
  }

  const fichier = await readProofFile(id);
  if (!fichier) {
    return NextResponse.json({ erreur: "Preuve introuvable." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(fichier.bytes), {
    headers: {
      "Content-Type": fichier.mime,
      "Content-Disposition": `inline; filename="preuve-${id}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
