import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// S1 : aucune auto-inscription d'administrateur, aucun compte staff par la
// porte publique. L'inscription email Better Auth est réservée aux créations
// internes (bootstrap technique, création d'un admin par un admin existant,
// acceptation d'invitation via `auth.api.signUpEmail` dans
// `src/lib/s1-comptes/staff.ts`) qui n'empruntent jamais HTTP et ne traversent
// donc pas ce garde.
// L'inscription unifiée (/sign-up, choix du profil client / administrateur)
// passe par son propre flux S1, jamais par `/api/auth/sign-up/email` en direct.
export default function proxy(request: NextRequest) {
  if (
    request.method === "POST" &&
    request.nextUrl.pathname.startsWith("/api/auth/sign-up")
  ) {
    return NextResponse.json(
      { error: "inscription publique fermée — voir /sign-up" },
      { status: 403 },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/sign-up/:path*"],
};
