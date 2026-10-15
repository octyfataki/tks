import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
