import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// S1 : la création d'un Compte ne passe jamais par la route publique.
// Le matcher ci-dessous est le seul filtre ; aucun test de méthode ni de
// chemin ici pour ne pas dupliquer sa logique.
export default function proxy(_request: NextRequest) {
  void _request;
  return NextResponse.json(
    {
      code: "INSCRIPTION_FERMEE",
      message: "inscription publique fermée — voir /sign-up",
    },
    { status: 403 },
  );
}

export const config = {
  matcher: ["/api/auth/sign-up/:path*"],
};
